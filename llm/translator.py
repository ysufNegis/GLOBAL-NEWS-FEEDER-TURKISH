import os
import sys

HAS_CTRANSLATE2 = False
HAS_TRANSFORMERS = False

translator_engine = None
sp_processor = None
engine_type = None  # "ctranslate2" or "transformers"

# Try CTranslate2 imports first
try:
    import ctranslate2
    import sentencepiece as spm
    from huggingface_hub import snapshot_download
    HAS_CTRANSLATE2 = True
except ImportError:
    pass

# Try Transformers fallback if CTranslate2 is not available
if not HAS_CTRANSLATE2:
    try:
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
        import torch
        HAS_TRANSFORMERS = True
    except ImportError:
        pass

def init_translator():
    global translator_engine, sp_processor, engine_type
    
    if translator_engine is not None:
        return True

    # 1. Attempt CTranslate2 initialization
    if HAS_CTRANSLATE2:
        try:
            print("Initializing CTranslate2 translation pipeline (facebook/nllb-200-distilled-600M)...")
            
            # Download converted NLLB-200 model from Hugging Face Hub (approx. 1.2GB)
            model_dir = snapshot_download("mijuanlo/nllb-200-distilled-600M-ct2-int8")
            
            # Load SentencePiece tokenizer
            sp_path = os.path.join(model_dir, "sentencepiece.bpe.model")
            sp_processor = spm.SentencePieceProcessor()
            sp_processor.load(sp_path)
            
            # Detect hardware and load Translator
            try:
                translator_engine = ctranslate2.Translator(
                    model_dir, 
                    device="cuda", 
                    compute_type="int8_float16"
                )
                print("CTranslate2 loaded successfully on CUDA GPU (int8_float16).")
            except Exception:
                print("CUDA GPU acceleration not available. Loading CTranslate2 on CPU (int8)...")
                translator_engine = ctranslate2.Translator(
                    model_dir, 
                    device="cpu", 
                    compute_type="int8"
                )
                print("CTranslate2 loaded successfully on CPU (int8).")
            
            engine_type = "ctranslate2"
            return True
        except Exception as e:
            print(f"CTranslate2 loading failed, attempting Hugging Face fallback: {e}")

    # 2. Attempt Transformers fallback initialization
    if HAS_TRANSFORMERS:
        try:
            print("Initializing Hugging Face Seq2Seq translation pipeline...")
            tokenizer = AutoTokenizer.from_pretrained("facebook/nllb-200-distilled-600M")
            model = AutoModelForSeq2SeqLM.from_pretrained("facebook/nllb-200-distilled-600M")
            
            device = 0 if torch.cuda.is_available() else -1
            translator_engine = pipeline(
                "translation",
                model=model,
                tokenizer=tokenizer,
                src_lang="eng_Latn",
                tgt_lang="tur_Latn",
                max_length=512,
                device=device
            )
            engine_type = "transformers"
            print("Hugging Face NLLB-200 translation pipeline loaded successfully.")
            return True
        except Exception as e:
            print(f"Hugging Face loading failed: {e}")

    # 3. Both failed
    print("NLLB Translation Error: No supported translation library is available.")
    print("Please install one of the configurations:")
    print("  Option A (Recommended, High Speed, Low Memory):")
    print("    pip install ctranslate2 sentencepiece huggingface_hub")
    print("  Option B (Standard fallback):")
    print("    pip install transformers torch sentencepiece")
    return False

def translate_to_turkish(text):
    global translator_engine, sp_processor, engine_type
    
    if not text or not text.strip():
        return text
        
    if translator_engine is None:
        if not init_translator():
            return text
            
    try:
        if engine_type == "ctranslate2" and translator_engine is not None and sp_processor is not None:
            # Tokenize for NLLB (prepend source lang token 'eng_Latn' and append end-of-sentence '</s>')
            source_tokens = ["eng_Latn"] + sp_processor.encode_as_pieces(text.strip()) + ["</s>"]
            
            try:
                # Run translation batch (forcing target language 'tur_Latn')
                results = translator_engine.translate_batch([source_tokens], target_prefix=[["tur_Latn"]])
            except Exception as execution_error:
                # Check if we were running on CUDA and failed due to missing cublas or CUDA libraries
                if hasattr(translator_engine, "device") and translator_engine.device == "cuda":
                    print(f"CTranslate2 CUDA execution failed ({execution_error}). Re-initializing engine on CPU...")
                    # Recover and load on CPU
                    from huggingface_hub import snapshot_download
                    model_dir = snapshot_download("mijuanlo/nllb-200-distilled-600M-ct2-int8")
                    translator_engine = ctranslate2.Translator(
                        model_dir, 
                        device="cpu", 
                        compute_type="int8"
                    )
                    # Retry translate_batch on CPU
                    results = translator_engine.translate_batch([source_tokens], target_prefix=[["tur_Latn"]])
                else:
                    raise execution_error
            
            output_tokens = results[0].hypotheses[0]
            
            # Remove target language token from decoded results
            if output_tokens and output_tokens[0] == "tur_Latn":
                output_tokens = output_tokens[1:]
                
            return sp_processor.decode(output_tokens)
            
        elif engine_type == "transformers" and translator_engine is not None:
            res = translator_engine(text.strip())
            if res and len(res) > 0:
                return res[0]['translation_text']
                
    except Exception as e:
        print(f"Translation engine execution error: {e}")
        
    return text

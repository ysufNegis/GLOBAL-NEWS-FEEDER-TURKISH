import sys
import os

# Add paths
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from translator import translate_to_turkish, init_translator

print("Initializing translator...")
success = init_translator()
print("Init status:", success)

if success:
    print("Translating test sentence...")
    res = translate_to_turkish("Federal Reserve signals potential rate cuts as inflation approaches 2% target.")
    print("Translation result:", res)
else:
    print("Translator initialization failed.")

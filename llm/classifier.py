import json
import ollama

from labels import LABELS


def classify_news(title, content):

    prompt = f"""
Sen uluslararası ilişkiler haberlerini etiketleyen bir AI'sın.

Sadece aşağıdaki etiketlerden seçim yap.

Etiketler:

{", ".join(LABELS)}

Kurallar

- En fazla 5 etiket seç.
- Yeni etiket üretme.
- Sadece JSON döndür.

Format

{{
    "labels":[]
}}

Başlık

{title}

İçerik

{content}
"""

    response = ollama.chat(
        model="qwen3:0.6b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        format="json"
    )

    return json.loads(response["message"]["content"])
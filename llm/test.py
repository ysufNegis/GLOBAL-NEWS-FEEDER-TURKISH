from classifier import classify_news

news = """
Israel launched new missile strikes against military facilities.

Iran promised retaliation.

The United Nations called for restraint.
"""

result = classify_news(
    "Israel launches missile strikes",
    news
)

print(result)
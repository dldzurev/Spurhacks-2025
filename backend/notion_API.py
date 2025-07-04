#!/usr/bin/env python3
import re, json
from google import genai
from notion_client import Client as NotionClient
import subprocess
import sys

# ─── CONFIG ───────────────────────────────────────────────────────────────────
GENAI_API_KEY      = "______________"
NOTION_TOKEN       = "______________"
NOTION_PARENT_PAGE = "______________"


MODEL_NAME         = "gemini-2.5-flash"

# ────────────────────────────────────────────────────────────────────────────────

# ─── init clients ─────────────────────────────────────────────────────────────
genai_client = genai.Client(api_key=GENAI_API_KEY)
notion       = NotionClient(auth=NOTION_TOKEN)
# ────────────────────────────────────────────────────────────────────────────────

def markdown_to_blocks(plan: str) -> list[dict]:
    """
    Parse a markdown-style plan into Notion blocks:
     - ### Heading → heading_2
     - * bullet    → bulleted_list_item
     - 1. item     → numbered_list_item
     - everything else → paragraph
    """
    blocks = []
    for line in plan.splitlines():
        text = line.strip()
        if not text:
            continue

        # Heading level 2 (###)
        if text.startswith("### "):
            content = text[4:].strip()
            blocks.append({
                "object":"block",
                "type":"heading_2",
                "heading_2":{"rich_text":[{"type":"text","text":{"content":content}}]}
            })

        # Bullet list
        elif text.startswith("* "):
            content = text[2:].strip()
            blocks.append({
                "object":"block",
                "type":"bulleted_list_item",
                "bulleted_list_item":{"rich_text":[{"type":"text","text":{"content":content}}]}
            })

        # Numbered list (e.g. "1. Do this")
        elif re.match(r"^\d+\.\s+", text):
            content = re.sub(r"^\d+\.\s+", "", text)
            blocks.append({
                "object":"block",
                "type":"numbered_list_item",
                "numbered_list_item":{"rich_text":[{"type":"text","text":{"content":content}}]}
            })

        # Fallback: paragraph
        else:
            blocks.append({
                "object":"block",
                "type":"paragraph",
                "paragraph":{"rich_text":[{"type":"text","text":{"content":text}}]}
            })

    return blocks

def chunkify(lst, size=100):
    for i in range(0, len(lst), size):
        yield lst[i:i+size]

def main():
    if not sys.stdin.isatty():
        idea = sys.stdin.read().strip()
    else:
        idea = input("Enter your project idea: ").strip()
    if not idea:
        print("No idea provided. Exiting.")
        return

    # build your prompt in one simple concat
    prompt = (
        "You are an expert project manager. Given this project idea:\n\n"
        f"{idea}\n\n"
        "Generate a thorough project plan using markdown:\n"
        "- Use `### ` for section titles (e.g. ### Milestones)\n"
        "- Use `* ` for bullet lists\n"
        "- Use `1. ` for numbered steps\n"
        "- Put any extra text as plain paragraphs\n"
    )

    # 1) call Gemini
    resp = genai_client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )
    plan = resp.text.strip()
    if not plan:
        print("Gemini returned nothing. Exiting.")
        return

    # 2) parse into properly typed Notion blocks
    all_blocks = markdown_to_blocks(plan)

    # 3) create page with first ≤100 children
    first_batch = list(chunkify(all_blocks, 100))[0]
    page = notion.pages.create(
        parent={"page_id": NOTION_PARENT_PAGE},
        properties={"title":[{"text":{"content":idea}}]},
        children=first_batch
    )
    page_id = page["id"]

    # 4) append remaining batches
    for batch in chunkify(all_blocks[100:], 100):
        notion.blocks.children.append(block_id=page_id, children=batch)

    print(" Done! Check Notion for your nicely formatted plan.")

if __name__ == "__main__":
    main()


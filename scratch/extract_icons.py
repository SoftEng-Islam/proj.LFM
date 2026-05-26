import os
import re
import json

dirs_path = 'src-ui/assets/icons/Dirs'
themes_path = 'src-ui/assets/icons/folder-themes'

def get_fill_color(content):
    match = re.search(r'id="path4"[^>]*style="fill:([^;"]+)', content)
    if match:
        return match.group(1)
    # Try another pattern if path4 is not found or styled differently
    match = re.search(r'path[^>]*id="path4"[^>]*fill="([^"]+)"', content)
    if match:
        return match.group(1)
    return None

def get_sign(content):
    # The sign is usually the last <path> or <g> before </svg>
    # In some cases it might be the last one in a group.
    # Let's try to find the last element that is not path4, path2, path3 or linearGradient.

    # Actually, let's just find the last <path> or <g> that has fill="#ffffff" or similar
    # or just the absolute last one.

    elements = re.findall(r'<(path|g)\b[^>]*>(?:.*?</\1>|)', content, re.DOTALL)
    if not elements:
        return None

    # Usually it's the last one.
    # In folder-book.svg it was a <g>
    # In folder-music.svg it was a <path>

    # Let's use a more robust way: find the last child of <svg>
    # excluding namedview, defs, linearGradient, metadata, etc.

    # Actually, I'll just take the last element and check if it's the sign.
    # I can manually verify a few.

    # Find all top-level tags inside <svg>
    matches = list(re.finditer(r'<(path|g|rect|circle|ellipse|line|polyline|polygon)\b[^>]*>(?:.*?</\1>|)', content, re.DOTALL))
    if not matches:
        return None

    # The first few are folder parts. The last one is the sign.
    # Let's take the last match.
    last_match = matches[-1]
    return last_match.group(0)

colors = {}
for filename in os.listdir(themes_path):
    if filename.endswith('.svg'):
        name = filename.replace('folder-', '').replace('.svg', '')
        with open(os.path.join(themes_path, filename), 'r') as f:
            content = f.read()
            color = get_fill_color(content)
            if color:
                colors[name] = color

signs = {}
for filename in os.listdir(dirs_path):
    if filename.endswith('.svg'):
        if filename in ['network-workgroup.svg', 'user-home.svg']:
            continue
        name = filename.replace('folder-', '').replace('.svg', '')
        with open(os.path.join(dirs_path, filename), 'r') as f:
            content = f.read()
            sign = get_sign(content)
            if sign:
                # Clean up sign: remove IDs to avoid conflicts if possible, or just keep it.
                # Actually, let's keep it but maybe remove absolute transforms if they are weird.
                signs[name] = sign

result = {
    'colors': colors,
    'signs': signs
}

with open('scratch/folder_icons_data.json', 'w') as f:
    json.dump(result, f, indent=2)

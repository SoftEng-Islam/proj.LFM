import os
import re
import json

dirs_path = 'src-ui/assets/icons/Dirs'
themes_path = 'src-ui/assets/icons/folder-themes'

def get_fill_color(content):
    # Try style="fill:#..."
    match = re.search(r'id="path4"[^>]*style="[^"]*fill:([^;"]+)', content)
    if match:
        return match.group(1)
    # Try fill="#..."
    match = re.search(r'id="path4"[^>]*fill="([^"]+)"', content)
    if match:
        return match.group(1)
    return None

def extract_tag_data(content, tag_name):
    # Extract defs
    defs_match = re.search(r'<defs[^>]*>(.*?)</defs>', content, re.DOTALL)
    defs_content = defs_match.group(1) if defs_match else ""

    # Identify IDs in defs and uniquely prefix them to avoid collisions
    ids = re.findall(r'id="([^"]+)"', defs_content)
    for id_val in ids:
        new_id = f"tag-{tag_name}-{id_val}"
        defs_content = defs_content.replace(f'id="{id_val}"', f'id="{new_id}"')
        content = content.replace(f'url(#{id_val})', f'url(#{new_id})')
        content = content.replace(f'xlink:href="#{id_val}"', f'xlink:href="#{new_id}"')

    # Extract non-folder elements
    matches = list(re.finditer(r'<(path|g|rect|circle|ellipse|line|polyline|polygon)\b[^>]*>(?:.*?</\1>|)', content, re.DOTALL))

    sign_markup = ""
    for m in matches:
        markup = m.group(0)
        # Check if it's a base folder part
        if 'id="path4"' in markup or 'id="path2"' in markup or 'id="path3"' in markup:
            continue
        if re.search(r'id="path[234](?:-\w+)?"', markup):
            continue

        sign_markup += markup + "\n"

    return defs_content.strip(), sign_markup.strip()

colors = {}
for filename in sorted(os.listdir(themes_path)):
    if filename.endswith('.svg'):
        name = filename.replace('folder-', '').replace('.svg', '')
        with open(os.path.join(themes_path, filename), 'r') as f:
            content = f.read()
            color = get_fill_color(content)
            if color:
                colors[name] = color

tags = {}
tag_defs = {}
for filename in sorted(os.listdir(dirs_path)):
    if filename.endswith('.svg'):
        name = filename.replace('folder-', '').replace('.svg', '')
        if name.endswith('.svg'):
             name = name.replace('.svg', '')

        with open(os.path.join(dirs_path, filename), 'r') as f:
            content = f.read()
            defs, sign_markup = extract_tag_data(content, name)
            if sign_markup:
                tags[name] = sign_markup
                if defs:
                    tag_defs[name] = defs

result = {
    'colors': colors,
    'tags': tags,
    'tagDefs': tag_defs
}

with open('scratch/folder_icons_data_v3.json', 'w') as f:
    json.dump(result, f, indent=2)

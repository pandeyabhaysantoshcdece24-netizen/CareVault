from pathlib import Path

root = Path(__file__).resolve().parent
files = [root / 'global.css', root / 'marketing.css']
replacements = [
    ('#edeae2', '#f7fbff'),
    ('#e9e8df', '#eef4ff'),
    ('#fafaf8', '#f7fbff'),
    ('#fbfbf8', '#f7fbff'),
    ('#f8faf8', '#f7fbff'),
    ('#143b3b', '#0d1f3b'),
    ('#1a4a4a', '#0d1f3b'),
    ('#0f4a4a', '#0d1f3b'),
    ('#0f3434', '#0d1f3b'),
    ('#101f1f', '#0d1f3b'),
    ('#89cf84', '#2563eb'),
    ('#c8e838', '#2563eb'),
    ('#e8f160', '#eef4ff'),
    ('#d4dc54', '#1e519d'),
    ('rgba(26, 74, 74,', 'rgba(13, 45, 115,'),
    ('rgba(45, 79, 74,', 'rgba(37, 99, 235,'),
    ('rgba(200, 232, 56,', 'rgba(37, 99, 235,'),
    ('background: #1a4a4a;', 'background: #0d1f3b;'),
    ('color: #1a4a4a;', 'color: #0d1f3b;'),
]

advanced = [
    ('linear-gradient(180deg, #143b3b, #1a4a4a);', 'linear-gradient(180deg, #0d1f3b, #133e82);'),
    ('linear-gradient(90deg, #101f1f 0 32%, #e8f160 32% 65%, #d4dc54 65% 100%);', 'linear-gradient(90deg, #0d1f3b 0 32%, rgba(37, 99, 235, 0.18) 32% 65%, rgba(37, 99, 235, 0.08) 65% 100%);'),
    ('background: linear-gradient(90deg, #1a4a4a, #c8e838);', 'background: linear-gradient(90deg, #0d1f3b, #2563eb);'),
    ('background: linear-gradient(145deg, #89cf84, #c8e838);', 'background: linear-gradient(145deg, #133e82, #2563eb);'),
    ('background: linear-gradient(145deg, #0f4a4a, #1a4a4a);', 'background: linear-gradient(145deg, #0d1f3b, #133e82);'),
    ('background: linear-gradient(145deg, #1a4a4a, #0f3434);', 'background: linear-gradient(145deg, #133e82, #0d1f3b);'),
    ('background: linear-gradient(90deg, #1a4a4a, #c8e838)', 'background: linear-gradient(90deg, #0d1f3b, #2563eb)'),
    ('border: 1px dashed rgba(26, 74, 74, 0.35);', 'border: 1px dashed rgba(13, 45, 115, 0.35);'),
    ('background: linear-gradient(180deg, #ffffff, #f8faf8);', 'background: linear-gradient(180deg, #ffffff, #f3f8ff);'),
    ('background: #c8e838;', 'background: #2563eb;'),
    ('background: rgba(200, 232, 56, 0.8);', 'background: rgba(37, 99, 235, 0.8);'),
    ('background: rgba(200, 232, 56, 0.96);', 'background: rgba(37, 99, 235, 0.96);'),
    ('background: rgba(200, 232, 56, 0.32);', 'background: rgba(37, 99, 235, 0.32);'),
    ('background: rgba(200, 232, 56, 0.14);', 'background: rgba(37, 99, 235, 0.14);'),
    ('background: linear-gradient(180deg, rgba(26, 74, 74, 0.04), rgba(26, 74, 74, 0.01));', 'background: linear-gradient(180deg, rgba(13, 45, 115, 0.04), rgba(13, 45, 115, 0.01));'),
    ('background: linear-gradient(135deg, rgba(26, 74, 74, 0.12), rgba(200, 232, 56, 0.18));', 'background: linear-gradient(135deg, rgba(13, 45, 115, 0.12), rgba(37, 99, 235, 0.18));'),
]

for path in files:
    text = path.read_text(encoding='utf-8')
    original = text

    for old, new in replacements + advanced:
        text = text.replace(old, new)

    if text != original:
        path.write_text(text, encoding='utf-8')
        print(f'Updated {path.name}')
    else:
        print(f'No changes for {path.name}')

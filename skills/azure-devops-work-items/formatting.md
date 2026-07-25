# ADO description formatting reference

Trailing spaces before closing tags are intentional — ADO's own editor writes them.

## Paragraphs

```html
<div><span>First paragraph.</span> </div>
<div><br> </div>
<div><span>Second paragraph.</span> </div>
```

## Inline formatting

- Bold: `<span><b>text</b></span>`
- Italics: `<span><i>text</i></span>`
- Underline: `<span><u>text</u></span>`
- Strikethrough: `<strike>text</strike>`
- Colour: `<span style="color:rgb(200, 38, 19) !important;">text</span>` — needs
  `!important` or ADO's dark mode overrides it.

## Lists

Bullet items wrap in `<span>`; numbered items don't:

```html
<ul><li><span>First item</span> </li></ul>
<ol><li>First item </li></ol>
```

## Indentation

```html
<blockquote style="margin:0 0 0 40px;border:none;"><div><span>Indented once</span> </div></blockquote>
```

## Code blocks

```html
<pre><code><div>line1</div><div>line2</div></code></pre>
```

## Images

```html
<div><img src="{attachment-url}" alt="{filename}"><br> </div>
```

## Plain links

```html
<a href="https://example.com" target=_blank rel="noopener noreferrer">https://example.com</a>
```

## Rich links (mentions)

Plain `#123`/`!123` render as inert text, not links — use the anchor form:

- User: `<a href="#" data-vss-mention="version:2.0,{user-id}">@Name</a>`
- Work item: `<a href="https://dev.azure.com/{org}/{project}/_workitems/edit/{id}/" data-vss-mention="version:1.0">#{id}</a>`
- PR: `<a href="/{org}/{project}/_git/{repo}/pullrequest/{id}" data-vss-mention="version:1.0" data-pr-title="{title}">!{id}</a>`

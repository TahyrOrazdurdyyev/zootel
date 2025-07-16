# Public Folder

This folder contains static assets that are served directly without processing.

## 📁 Folder Structure

- `images/` - Static image files that don't need processing

## 🎯 Usage Examples

### Referencing Images from Public Folder

```jsx
function MyComponent() {
  return (
    <div>
      {/* Reference images from public folder with absolute paths */}
      <img src="/images/logo.png" alt="Logo" />
      <img src="/images/favicon.ico" alt="Favicon" />
    </div>
  );
}
```

### In CSS

```css
.hero-background {
  background-image: url('/images/hero-bg.jpg');
}
```

### In HTML (index.html)

```html
<link rel="icon" href="/images/favicon.ico" />
<meta property="og:image" content="/images/og-image.png" />
```

## 📝 Notes

- Files in this folder are served as-is without processing
- Always reference with absolute paths starting with `/`
- Perfect for favicons, robots.txt, manifest files, etc.
- No optimization or filename hashing
- Available at build time and runtime 
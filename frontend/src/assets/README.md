# Assets Folder

This folder contains static assets that are imported directly into React components.

## 📁 Folder Structure

- `images/` - Image files (PNG, JPG, SVG, etc.)

## 🎯 Usage Examples

### Importing Images in Components

```jsx
// Import image from assets
import logoImage from '../assets/images/logo.png';
import iconSvg from '../assets/images/icon.svg';

function MyComponent() {
  return (
    <div>
      <img src={logoImage} alt="Logo" />
      <img src={iconSvg} alt="Icon" />
    </div>
  );
}
```

### Supported Image Formats

- PNG
- JPG/JPEG  
- SVG
- WebP
- GIF

## 📝 Notes

- Images in this folder are processed by Vite during build
- They get optimized and their filenames are hashed for caching
- Use this folder for images that need to be imported in components
- For static images that don't need processing, use `/public/images/` instead 
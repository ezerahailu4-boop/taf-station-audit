import fs from 'fs';

fs.mkdirSync('dist', { recursive: true });
fs.copyFileSync('index.html', 'dist/index.html');
fs.cpSync('css', 'dist/css', { recursive: true });
fs.cpSync('js', 'dist/js', { recursive: true });

if (fs.existsSync('public')) {
  fs.cpSync('public', 'dist', { recursive: true });
}

console.log('Build successful: static assets prepared in dist/');

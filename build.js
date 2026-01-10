const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/firaga.tsx'],
  bundle: true,
  outfile: 'docs/firaga.js',
  external: ['jspdf'],
  jsxFactory: 'preact.h',
  jsxFragment: 'preact.Fragment',
  metafile: true,
  loader: {
    '.csv': 'text',
    '.txt': 'text',
    '.css': 'text'
  }
}).then(() => {
  console.log('Build succeeded');
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});

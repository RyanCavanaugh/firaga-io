const esbuild = require('esbuild');
const fs = require('fs');

try {
    const result = esbuild.buildSync({
        entryPoints: ['src/firaga.tsx'],
        bundle: true,
        outfile: 'docs/firaga.js',
        external: ['jspdf'],
        jsxFactory: 'preact.h',
        jsxFragment: 'preact.Fragment',
        loader: {
            '.csv': 'text',
            '.txt': 'text',
            '.css': 'text'
        },
        metafile: true,
        logLevel: 'info'
    });
    
    // Write metafile
    if (result.metafile) {
        fs.writeFileSync('meta.json', JSON.stringify(result.metafile, null, 2));
    }
    
    console.log('Build completed successfully');
    console.log('Errors:', result.errors.length);
    console.log('Warnings:', result.warnings.length);
    
    if (result.errors.length > 0) {
        console.error('Errors:', JSON.stringify(result.errors, null, 2));
        process.exit(1);
    }
} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}

const esbuild = require('esbuild');
const path = require('path');

async function build() {
  try {
    // Bundle the Lambda handler from TypeScript source
    await esbuild.build({
      entryPoints: ['app.ts'],
      bundle: true,
      platform: 'node',
      target: 'node20',
      outfile: 'dist/lambda.js',
      external: [
        '@prisma/client',
        '@prisma/engines', 
        'prisma'
      ],
      minify: true,
      sourcemap: false,
      format: 'cjs',
      tsconfig: './tsconfig.json',
      resolveExtensions: ['.ts', '.js'],
      loader: {
        '.ts': 'ts'
      },
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      logLevel: 'info'
    });

    console.log('Bundle created successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
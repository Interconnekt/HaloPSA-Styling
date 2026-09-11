import { copyFile, mkdir } from 'node:fs/promises';

const destination = new URL('../.assets/__interconnekt/', import.meta.url);
await mkdir(destination, { recursive: true });
for (const name of ['self-service-portal-design.css', 'iframe-theme.js']) {
    await copyFile(new URL('../../' + name, import.meta.url), new URL(name, destination));
    console.log('Bundled ' + name);
}

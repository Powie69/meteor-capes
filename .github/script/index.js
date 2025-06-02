import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

const response = await fetch('https://meteorclient.com/api/capes');

if (response.status >= 400) throw new Error(`Error fetching cape list: ${response}`);

const links = (await response.text())
	.split('\n')
	.filter(l => l.trim())
	.map(l => l.split(' ')[1]);

const outputDir = `Capes - ${new Date().toISOString().slice(0, 10)}`;
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir);
}

let index = 0;

for (const link of links) {
	const response = await fetch(link);

	if (response.status >= 400) {
		if (response.status === 404) {
			console.log(`Cape not found: ${link}`);
			continue;
		}
		throw new Error(`${link} \n Error fetching cape: ${response}`);
	}

	if (response.headers.get("content-type") !== 'image/png') throw new Error(`wtf??? ${link}\n${response.headers['content-type']}`);

	const filename = `[${index}] - ${path.basename(link)}`;
	const outputPath = path.join(outputDir, filename);

	try {
		await pipeline(response.body, fs.createWriteStream(outputPath));
	} catch (err) { // ik I'm catching it just to rethrow it, but i want the error message thing.
		throw new Error(`Error writing file ${filename}:`, err);
	}

	console.log(`Downloaded cape: ${link}`);
	index++;
}

console.log(`>All valid capes downloaded successfully!\n> ${index} out of ${links.length} are valid for download. (${((index / links.length) * 100).toFixed(2)}%)`);
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

const response = await fetch('https://meteorclient.com/api/capes');

if (response.status >= 400) {
	throw new Error(`Error fetching cape list: ${response}`);
}

const data = await response.text();

const links = data.split('\n')
	.filter(line => line.trim())
	.map(line => line.split(' ')[1]);

const outputDir = `Capes 🠚 ${new Date().toISOString().slice(0, 10)}`;
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

	if (response.headers.get("content-type") !== 'image/png') {
		throw new Error(`wtf??? ${link} \n ${response.headers['content-type']}`);
	}

	const filename = `[${index}] - ${path.basename(link)}`;
	const outputPath = path.join(outputDir, filename);

	try {
		const fileStream = fs.createWriteStream(outputPath);
		await pipeline(response.body, fileStream);
	} catch (err) {
		throw new Error(`Error writing file ${filename}:`, err);
	}

	console.log(`Downloaded cape: ${link}`);
	index++;
}

console.log(`>All capes downloaded successfully!\n> ${index} out of ${links.length} capes downloaded (${((index / links.length) * 100).toFixed(2)}%)`);
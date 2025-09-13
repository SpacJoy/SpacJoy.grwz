/** @format */

const text = 'Hello "\World"\n©';
const unicodeText = text.replace(
	/[^\x20-\x7E]/g,
	(c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`
);
console.log(unicodeText); // Hello "World"\u000a\u00a9

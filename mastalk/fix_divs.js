/* toots/*.html 의 닫히지 않은 </div> 를 보정합니다.
 * 각 .ttobot-status 블록이 열린 <div> 수만큼 닫히도록 </div> 를 채웁니다.
 * 이미 정상인 파일은 건드리지 않습니다(여러 번 실행해도 안전).
 * 실행:  node fix_divs.js   (그 다음 node apply_theme.js)
 * 다른 폴더 지정: node fix_divs.js <폴더경로>
 */
const fs = require("fs");
const path = require("path");

const DIR = process.argv[2] || path.join(process.env.ENTY_ROOT || __dirname, "toots");
const count = (s, re) => (s.match(re) || []).length;

let fixed = 0;
for (const name of fs.readdirSync(DIR).filter(n => n.endsWith(".html") && !n.startsWith("_"))) {
  const file = path.join(DIR, name);
  const html = fs.readFileSync(file, "utf8");
  const eol = html.includes("\r\n") ? "\r\n" : "\n";

  // <body> 이후만 대상으로 삼고, 끝쪽의 <script src=…> / </body> 는 꼬리로 분리
  const bodyAt = html.search(/<body[^>]*>/i);
  if (bodyAt < 0) continue;
  const bodyOpenEnd = html.indexOf(">", bodyAt) + 1;
  const head = html.slice(0, bodyOpenEnd);
  let rest = html.slice(bodyOpenEnd);

  const tailAt = rest.search(/[ \t]*<script\b[^>]*\bsrc=|<\/body>/i);
  const tail = tailAt >= 0 ? rest.slice(tailAt) : "";
  if (tailAt >= 0) rest = rest.slice(0, tailAt);

  const parts = rest.split(/(?=<div class="ttobot-status")/);
  let added = 0;

  const out = parts.map(part => {
    if (!part.startsWith('<div class="ttobot-status"')) return part;
    const missing = count(part, /<div\b/g) - count(part, /<\/div>/g);
    if (missing <= 0) return part;
    added += missing;
    return part.replace(/\s+$/, "") + (eol + "</div>").repeat(missing) + eol + eol;
  });

  if (!added) continue;
  fs.writeFileSync(file, head + out.join("") + tail, "utf8");
  console.log(`  보정: ${name}  (</div> ${added}개 추가)`);
  fixed++;
}
console.log(`\n완료 — ${fixed}개 파일 수정.`);

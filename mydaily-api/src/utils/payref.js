function pad2(n) {
  return String(n).padStart(2, "0");
}

function getTodayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}${m}${day}`;
}

function rand4() {
  return Math.floor(1000 + Math.random() * 9000);
}

function genRefCode() {
  const date = getTodayYMD();
  const random = rand4();
  return `MYDAILY-Premium-${date}-${random}`;
}

module.exports = { genRefCode };
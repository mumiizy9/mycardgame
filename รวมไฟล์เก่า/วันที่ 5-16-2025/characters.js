/** 
 * characters.js 
 * 
 * จุดประสงค์: แยกข้อมูลตัวละครพื้นฐาน (starter character pool) ออกจาก main.js 
 * เพื่อคงโครงสร้างโปรเจคให้สะอาดและง่ายต่อการขยายหรือแก้ไข 
 * 
 * หมายเหตุ: ต้องแน่ใจว่า characters.js ถูกโหลด <script> ก่อน main.js เสมอ!
 */

// ประกาศ array ของข้อมูลตัวละครหลักสำหรับเกม
window.characters = [
  { 
    name: "อัศวินไฟ",             // ชื่อ
    hp: 200,                      // พลังชีวิตพื้นฐาน
    atk: 55,                      // พลังโจมตี
    skill: "ฟาดดาบรุนแรง",        // ชื่อสกิล (string)
    element: "ไฟ"                 // ธาตุ
  },
  { 
    name: "นักธนูน้ำ",
    hp: 150,
    atk: 70,
    skill: "ยิงทะลวง",
    element: "น้ำ"
  },
  { 
    name: "ฮีลเลอร์แสง",
    hp: 170,
    atk: 40,
    skill: "ฟื้นฟูพลังชีวิต",
    element: "แสง"
  },
  {
    name: "นักเวทสายฟ้า",
    hp: 130,
    atk: 85,
    skill: "ช็อตสายฟ้า",
    element: "สายฟ้า"
  },
  { 
    name: "แทงค์ไม้",
    hp: 220,
    atk: 35,
    skill: "ป้องกันแข็งแกร่ง",
    element: "ไม้"
  },
  { 
    name: "สาวดาบมืด",
    hp: 160,
    atk: 60,
    skill: "วายุดำ",
    element: "มืด"
  }
];

/*
======= คำอธิบายโค้ด =======
- สร้างตัวแปร global window.characters ให้เป็น array (list) ข้อมูลตัวละครพื้นฐาน เพื่อใช้เป็น pool ในการเลือกทีม
- ข้อมูลแต่ละตัวหลักคือ name, hp, atk, skill (string สกิลเบื้องต้น), element (ธาตุ)
- ข้อมูลรูปแบบเก่านี้จะถูกปรับโครงสร้างหรือแปลงแบบอัตโนมัติใน char-skill.js หากต้องการใช้ระบบสกิล/บัฟที่ซับซ้อน
- สามารถ push หรือเพิ่มตัวละครใหม่ได้ในอนาคต (หรือเปลี่ยนเป็น structure แบบใหม่)

======= วิธีใช้ & การโหลดไฟล์ =======
- ใส่ <script src="characters.js"></script> ก่อน main.js ใน index.html
- คุณสามารถเพิ่มฟิลด์ stat ใหม่ๆ ได้หากต้องการขยายระบบ (เช่น spd, skills, image ฯลฯ)
- ไม่ควรลบหรือคอมเมนต์ทั้งไฟล์ characters.js หรือตัวแปรนี้ เว้นแต่จะ import จากแหล่งอื่น

======= ตัวอย่าง index.html =======
<!DOCTYPE html>
<html lang="th">
  <head>
    ...
    <script src="characters.js"></script>
    <script src="main.js"></script>
    ...
  </head>
  <body> ... </body>
</html>
*/

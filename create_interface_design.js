const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, VerticalAlign, ImageRun,
  PageNumber, Footer, HeadingLevel
} = require('docx');
const fs = require('fs');

const screenshot = 'C:/Users/admin/AppData/Local/Temp/codex-clipboard-20e41220-03e0-454f-800b-c6ad7cd6f696.png';
const output = 'C:/Users/admin/Desktop/DAN COLLEGE/2ND YEAR/1ST SEM/INFO MANAGEMENT/plm-seams-project/PLM_SEAMS_Interface_Design_Landing_Page.docx';

const FONT = 'Times New Roman';
const navy = '102A5A';
const thin = { style: BorderStyle.SINGLE, size: 6, color: '000000' };
const borders = { top: thin, bottom: thin, left: thin, right: thin, insideHorizontal: thin, insideVertical: thin };

function run(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: opts.size || 24, bold: !!opts.bold, italics: !!opts.italics, color: opts.color });
}

function p(children = [], opts = {}) {
  return new Paragraph({ children, alignment: opts.alignment, spacing: opts.spacing || { after: 80 }, indent: opts.indent });
}

function req(n, text, level = 0) {
  return new Paragraph({
    children: [run(`${n}. `, { bold: true, size: 21 }), run(text, { size: 21 })],
    indent: { left: level ? 420 : 0, hanging: 260 },
    spacing: { after: 55 }
  });
}

const imageData = fs.readFileSync(screenshot);

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 24 }, paragraph: { spacing: { after: 80 } } } } },
  sections: [{
    properties: { page: { margin: { top: 720, right: 900, bottom: 720, left: 900 } } },
    footers: { default: new Footer({ children: [p([run('')], { alignment: AlignmentType.RIGHT })] }) },
    children: [
      p([run('6. INTERFACE DESIGN', { bold: true, size: 28 })], { alignment: AlignmentType.CENTER, spacing: { after: 20 } }),
      p([run('For this section, kindly refer to the below screenshot sample.', { italics: true, color: 'C00000', size: 20 })], { alignment: AlignmentType.CENTER, spacing: { after: 220 } }),
      p([run('6.1 Feature 1 Module Name e.g. Landing Page', { bold: true, size: 23 })], { spacing: { after: 100 } }),
      p([run('1.  Landing Page', { bold: true, size: 22 })], { indent: { left: 180 }, spacing: { after: 40 } }),
      p([run('The landing page serves as the entry point of the PLM SEAMS and allows users to choose the appropriate user role before proceeding to the system.', { size: 21 })], { indent: { left: 520 }, spacing: { after: 170 } }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [4700, 4700],
        borders,
        rows: [
          new TableRow({ children: [
            new TableCell({ width: { size: 4700, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [p([run('WIREFRAME OR UI/UX', { bold: true, size: 18 })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } })] }),
            new TableCell({ width: { size: 4700, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [p([run('REQUIREMENTS', { bold: true, size: 18 })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } })] })
          ] }),
          new TableRow({ children: [
            new TableCell({ width: { size: 4700, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [p([new ImageRun({ data: imageData, type: 'png', transformation: { width: 325, height: 146 } })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } })] }),
            new TableCell({ width: { size: 4700, type: WidthType.DXA }, verticalAlign: VerticalAlign.TOP, children: [
              req(1, 'Display the PLM SEAMS logo near the upper center of the page.'),
              req(2, 'Display the welcome message “Welcome to PLM SEAMS!” below the logo.'),
              req(3, 'Display the label “SIGN IN AS:” to instruct the user to select a role.'),
              req(4, 'Provide three selectable role cards: Student, Student Organization, and Administrators.'),
              req(5, 'Each role card must contain an appropriate icon, role name, supporting description, and a right-arrow indicator.'),
              req(6, 'Use the following role descriptions:\nStudent – Registrations;\nStudent Organization – Events & Proposals;\nAdministrators – Monitoring & Clearance.', 1),
              req(7, 'Use a PLM campus background image with a dark blue overlay to keep the foreground text and cards readable.'),
              req(8, 'Display the system identification text at the bottom: “PAMANTASAN NG LUNGSOD NG MAYNILA STUDENT EVENTS AND ADMINISTRATION MANAGEMENT SYSTEM.”'),
              req(9, 'When a user selects a role card, proceed to the corresponding module or sign-in flow.')
            ] })
          ] })
        ]
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buf => fs.writeFileSync(output, buf));

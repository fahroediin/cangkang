from pathlib import Path
import json
from docx import Document
from docx.shared import Inches,Pt,RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
ROOT=Path(__file__).resolve().parent
def build(filename,title,kind,sections):
 d=Document();sec=d.sections[0]
 sec.page_width=Inches(8.5);sec.page_height=Inches(11)
 sec.top_margin=sec.bottom_margin=Inches(.7);sec.left_margin=sec.right_margin=Inches(.8)
 n=d.styles['Normal'];n.font.name='Arial';n.font.size=Pt(10.5);n.paragraph_format.space_after=Pt(7);n.paragraph_format.line_spacing=1.08
 for name,size in [('Title',25),('Subtitle',13),('Heading 1',16),('Heading 2',12)]:
  st=d.styles[name];st.font.name='Arial';st.font.size=Pt(size);st.font.color.rgb=RGBColor(0,0,0);st.paragraph_format.space_after=Pt(8)
  if name.startswith('Heading'):st.paragraph_format.keep_with_next=True
 cs=d.styles.add_style('Source Code',1);cs.font.name='Courier New';cs.font.size=Pt(8.5);cs.paragraph_format.space_after=Pt(2)
 header=sec.header.paragraphs[0];header.text='TELURFARM  /  '+kind.upper();header.runs[0].font.size=Pt(8);header.runs[0].font.color.rgb=RGBColor(0,0,0)
 f=sec.footer.paragraphs[0];f.alignment=WD_ALIGN_PARAGRAPH.RIGHT;f.add_run('Versi 5.1  |  ').font.size=Pt(8)
 fld=OxmlElement('w:fldSimple');fld.set(qn('w:instr'),'PAGE');f._p.append(fld)
 d.add_paragraph(title,'Title');d.add_paragraph('Versi 5 1    27 Oktober 2026','Subtitle')
 d.add_paragraph('Dokumen '+kind+' untuk aplikasi peternakan ayam petelur dan distribusi telur berbasis web serta native Android dan iOS.')
 for i,s in enumerate(sections,1):
  heading=d.add_heading(str(i)+' '+s['title'],1)
  if s['title']=='Batas kapasitas dan pekerjaan berikutnya':heading.paragraph_format.page_break_before=True
  for b in s['blocks']:
   if 'p' in b:d.add_paragraph(b['p'])
   elif 'code' in b:
    for line in b['code'].splitlines():d.add_paragraph(line,'Source Code')
   else:
    tb=b['table'];cols=len(tb['headers']);t=d.add_table(rows=1,cols=cols);t.autofit=False
    widths={2:[2.0,4.9],3:[1.05,2.1,3.75],4:[.55,1.4,4.4,.55]}[cols]
    for j,w in enumerate(widths):t.columns[j].width=Inches(w)
    for c,tx in zip(t.rows[0].cells,tb['headers']):c.text=tx
    h=OxmlElement('w:tblHeader');t.rows[0]._tr.get_or_add_trPr().append(h)
    for row in tb['rows']:
     for c,tx in zip(t.add_row().cells,row):c.text=str(tx)
    for ri,row in enumerate(t.rows):
     row._tr.get_or_add_trPr().append(OxmlElement('w:cantSplit'))
     for ci,c in enumerate(row.cells):
      c.width=Inches(widths[ci]);c.vertical_alignment=1;pr=c._tc.get_or_add_tcPr();m=OxmlElement('w:tcMar')
      for e in ['top','left','bottom','right']:
       el=OxmlElement('w:'+e);el.set(qn('w:w'),'85');el.set(qn('w:type'),'dxa');m.append(el)
      pr.append(m);border=OxmlElement('w:tcBorders')
      for e in ['top','left','bottom','right']:
       el=OxmlElement('w:'+e);el.set(qn('w:val'),'single');el.set(qn('w:sz'),'4');el.set(qn('w:color'),'D9D9D9');border.append(el)
      pr.append(border)
      if ri==0:
       sh=OxmlElement('w:shd');sh.set(qn('w:fill'),'E8EFF7');pr.append(sh)
      for p in c.paragraphs:
       p.paragraph_format.space_before=Pt(3);p.paragraph_format.space_after=Pt(3);p.paragraph_format.line_spacing=1.03
       for r in p.runs:r.font.size=Pt(9.5);r.bold=(ri==0);r.font.color.rgb=RGBColor(0,0,0)
    d.add_paragraph('').paragraph_format.space_after=Pt(2)
 for st in d.styles:
  for el in list(st.element.xpath('.//w:pBdr')):el.getparent().remove(el)
 d.core_properties.title=title;d.core_properties.subject='TelurFarm 5.1 '+kind;d.core_properties.author=''
 path=ROOT/('TelurFarm-v5.1-'+filename+'.docx');d.save(path)
 return path

sections=json.loads((ROOT/'content.json').read_text())
build('Panduan-RBAC-dan-Implementasi','TelurFarm Panduan Rilis dan RBAC Versi 5 1','RBAC dan Implementasi',sections)

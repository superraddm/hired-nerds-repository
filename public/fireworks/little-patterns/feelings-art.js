/* Original vector people, authored for Nook's Garden. See assets/feelings/NOTICE.txt.
   Every portrait/pose is built from this one local module: no image requests on a choice. */
(function(root){
  'use strict';
  const F=typeof module!=='undefined'&&module.exports?require('./feelings-data.js'):root.NookFeelings;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const brows={happy:'M84 88 Q93 83 102 87 M138 87 Q147 83 156 88',sad:'M84 91 L102 84 M138 84 L156 91',angry:'M84 83 L102 91 M138 91 L156 83',calm:'M84 87 Q93 85 102 87 M138 87 Q147 85 156 87',worried:'M84 88 Q94 79 102 80 M138 80 Q146 79 156 88',excited:'M84 80 Q93 74 102 78 M138 78 Q147 74 156 80'};
  const mouth={happy:'<path d="M104 127 Q120 144 137 127"/>',sad:'<path d="M105 139 Q120 125 136 139"/>',angry:'<path d="M105 134 Q120 132 136 134"/>',calm:'<path d="M108 131 Q120 134 132 131"/>',worried:'<path d="M110 134 Q120 129 131 135"/>',excited:'<path d="M106 125 Q120 121 135 125 Q135 145 120 145 Q106 143 106 125Z" fill="#714b4b"/><path d="M111 127 L130 127" stroke="#fff4e5" stroke-width="4"/>'};
  brows.proud='M84 83 Q93 78 102 82 M138 82 Q147 78 156 83';
  brows.surprised='M84 75 Q93 68 102 74 M138 74 Q147 68 156 75';
  brows.frustrated='M84 85 L102 89 M138 89 L156 85';
  brows.disappointed='M84 90 Q93 85 102 86 M138 86 Q147 85 156 90';
  mouth.proud='<path d="M101 126 Q120 150 140 126 Q120 140 101 126Z" fill="#fff4e5"/>';
  mouth.surprised='<ellipse cx="120" cy="135" rx="8" ry="10" fill="#714b4b"/>';
  mouth.frustrated='<path d="M105 137 L134 130"/>';
  mouth.disappointed='<path d="M110 140 Q120 133 130 140"/>';
  function hair(p,back=false){
    if(back)return p.style==='bob'?`<path d="M59 112 Q43 31 103 22 Q173 5 183 80 L187 161 Q165 178 148 164 L84 164 Q64 169 55 157Z" fill="${p.hair}"/>`:'';
    const shapes={curls:'M61 95 Q46 62 59 51 Q48 28 76 29 Q80 5 105 20 Q131 3 146 21 Q176 14 180 44 Q194 62 179 96 L165 63 Q146 68 131 48 Q109 65 90 51 Q79 71 62 73Z',short:'M62 96 Q52 57 72 36 Q101 10 139 23 Q174 21 181 66 L175 94 L164 59 Q134 68 114 44 Q100 62 65 70Z',waves:'M61 98 Q44 35 90 23 Q141 5 167 29 Q185 35 181 91 L168 72 L165 50 Q143 60 119 44 Q91 69 65 64Z',bob:'M60 100 Q49 40 88 26 Q141 9 169 40 Q182 58 177 104 L163 77 L158 50 Q143 73 78 65 L70 103Z'};
    return `<path d="${shapes[p.style]}" fill="${p.hair}"/>`;
  }
  function svg(id,feeling,options={}){
    const p=F.person(id),f=F.FEELINGS.includes(feeling)?feeling:'calm',pose=!!options.pose;
    const title=options.label||p.name+' with '+F.DESCRIPTIONS[f]+'.';
    const height=pose?320:238;
    const arms=pose?((f==='excited'||f==='surprised')?`<path d="M74 197 Q54 224 39 161 M166 197 Q187 224 202 161"/>` :f==='proud'?'<path d="M75 196 Q69 226 109 211 M166 196 Q173 226 131 211"/>':f==='frustrated'?'<path d="M73 199 Q58 232 42 233 M166 199 Q182 232 199 233"/>':f==='worried'?'<path d="M75 196 Q68 238 110 242 M166 196 Q176 237 130 242"/>':f==='happy'?'<path d="M73 199 Q58 232 42 233 M166 199 Q182 232 199 233"/>':'<path d="M74 195 Q65 232 79 267 M167 195 Q176 232 161 267"/>'):'';
    let hands='';
    if(pose){const pts=(f==='excited'||f==='surprised')?[[38,152],[203,152]]:f==='proud'?[[109,211],[131,211]]:f==='worried'?[[112,242],[128,242]]:(f==='happy'||f==='frustrated')?[[39,233],[201,233]]:[[80,272],[160,272]];
      hands=pts.map(([x,y])=>`<g transform="translate(${x} ${y})"><path d="M-7 7 Q-12 0 -8 -5 L-7 -12 Q-6 -16 -4 -12 L-3 -4 L-2 -15 Q0 -18 1 -14 L2 -4 L4 -13 Q7 -15 7 -10 L7 1 Q14 -4 14 1 Q10 11 3 13 Q-3 15 -7 7Z" fill="${p.skin}"/></g>`).join('');
    }
    return `<svg class="feeling-art${pose?' pose-art':''}" viewBox="0 0 240 ${height}" xmlns="http://www.w3.org/2000/svg" ${options.decorative?'aria-hidden="true"':`role="img" aria-label="${esc(title)}"`} data-person="${p.id}" data-expression="${f}">
      ${pose?'<ellipse cx="120" cy="306" rx="72" ry="8" fill="#e8e5ce"/><path d="M78 256 L69 301 L105 301 L120 271 L135 301 L171 301 L162 256Z" fill="#4e5a70"/>':''}
      ${hair(p,true)}<path d="M49 237 Q49 184 86 175 L153 175 Q191 183 191 237 ${pose?'L168 267 L72 267':'L49 237'}Z" fill="${p.shirt}"/>
      <g fill="none" stroke="${p.shirt}" stroke-width="25" stroke-linecap="round">${arms}</g>
      <path d="M104 155 L104 181 Q120 193 137 181 L137 155" fill="${p.shade}"/>
      <ellipse cx="62" cy="112" rx="9" ry="14" fill="${p.skin}"/><ellipse cx="178" cy="112" rx="9" ry="14" fill="${p.skin}"/>
      <path d="M64 91 Q61 37 120 34 Q179 37 176 94 L174 129 Q169 168 120 175 Q70 168 66 129Z" fill="${p.skin}"/>
      ${hair(p)}<g fill="none" stroke="#453b43" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="${brows[f]}"/>
      <path d="M119 106 L114 119 L122 121" stroke="${p.shade}" stroke-width="3"/>${mouth[f]}</g>
      <ellipse cx="94" cy="103" rx="4" ry="${f==='surprised'?7:f==='disappointed'?2.5:f==='excited'?6:4.8}" fill="#34333f"/><ellipse cx="146" cy="103" rx="4" ry="${f==='surprised'?7:f==='disappointed'?2.5:f==='excited'?6:4.8}" fill="#34333f"/>
      ${p.glasses?'<g fill="none" stroke="#4a5868" stroke-width="3"><rect x="77" y="94" width="34" height="25" rx="10"/><rect x="129" y="94" width="34" height="25" rx="10"/><path d="M111 103 Q120 98 129 103 M66 99 L77 102 M163 102 L175 99"/></g>':''}
      ${hands}${options.prop?`<g transform="translate(164 197)"><rect width="53" height="35" rx="7" fill="#d9c9e9" stroke="#80658f" stroke-width="2.5"/>${options.prop==='finished'?'<path d="M26 0 V12 Q35 11 35 18 Q35 24 26 23 V35 M0 18 H14 Q12 9 20 9 Q27 9 26 18" fill="none" stroke="#80658f" stroke-width="2"/>':'<path d="M19 13 Q14 8 20 5 Q27 3 28 9 L35 9 L35 20 Q41 18 43 23 Q44 29 35 28 L35 32 L20 32 L20 24 Q11 27 10 20 Q9 14 19 16Z" fill="#b9a2d1"/>'}</g>`:''}
    </svg>`;
  }
  // Everyday objects are large enough to recognise on a phone. No flashing,
  // tears, injury or threatening figures; each scene is a single quiet moment.
  const scenes={
    drawing:'<rect x="34" y="54" width="158" height="160" rx="6" fill="#fffef3" stroke="#a1ad97" stroke-width="3"/><circle cx="151" cy="86" r="16" fill="#e8c970"/><path d="M57 156L107 110L159 156M68 148V190H145V148" fill="#cfb4d8" stroke="#89709e" stroke-width="5"/><rect x="98" y="162" width="20" height="28" fill="#b3d7ca"/><path d="M178 234L196 144" stroke="#b99c53" stroke-width="9"/>',
    knot:'<path d="M35 194Q80 160 103 134Q144 94 159 133Q175 173 121 169Q73 167 90 121Q107 86 137 146Q154 180 195 195" fill="none" stroke="#a77f63" stroke-width="12" stroke-linecap="round"/><path d="M109 127L136 161" stroke="#fffbe7" stroke-width="3"/>',
    butterfly:'<path d="M111 146V211M111 184Q76 179 80 159Q104 158 111 184" fill="#a2bc87" stroke="#6f915d" stroke-width="4"/><g fill="#cdb2dc" stroke="#8a739d" stroke-width="3"><path d="M108 103Q61 46 57 101Q56 134 109 131Q71 167 103 177L120 130Z"/><path d="M120 103Q164 46 172 101Q177 134 121 131Q161 167 129 177L110 130Z"/></g><path d="M115 106V147M115 107L105 95M115 107L126 95" fill="none" stroke="#6d5c62" stroke-width="5"/>',
    'empty-pot':'<ellipse cx="112" cy="146" rx="53" ry="15" fill="#ece7d5" stroke="#768fa5" stroke-width="4"/><path d="M59 146V205Q112 235 165 205V146" fill="#b4d5e7" stroke="#768fa5" stroke-width="4"/><ellipse cx="112" cy="146" rx="53" ry="15" fill="#fffef3" stroke="#768fa5" stroke-width="4"/><path d="M176 194L189 93" stroke="#ad8c62" stroke-width="9"/><path d="M183 113L185 89Q200 74 198 112Z" fill="#b4d5e7"/>',
    planting:'<path d="M64 156H164L150 224H78Z" fill="#ce987c"/><ellipse cx="114" cy="157" rx="51" ry="13" fill="#937156"/><ellipse cx="115" cy="151" rx="8" ry="5" fill="#e6c992"/><path d="M45 153L25 110L44 101L65 145Z" fill="#8baba3"/><path d="M28 108L17 77" stroke="#b79c73" stroke-width="9"/>',
    beads:'<path d="M26 190Q76 122 141 154L180 121" fill="none" stroke="#8e775d" stroke-width="5"/><g stroke="#927b35" stroke-width="3"><circle cx="52" cy="168" r="18" fill="#b6d9c8"/><circle cx="91" cy="151" r="18" fill="#e9ca76"/><circle cx="165" cy="186" r="24" fill="#d2b7dc"/></g><circle cx="165" cy="186" r="7" fill="#fffbe7"/>',
    sprout:'<path d="M64 156H164L150 224H78Z" fill="#ce987c"/><ellipse cx="114" cy="157" rx="51" ry="13" fill="#937156"/><path d="M113 156V109M113 126Q71 114 78 87Q109 84 113 126M113 121Q151 113 150 87Q121 82 113 121" fill="#a2bc87" stroke="#6f915d" stroke-width="4"/>',
    'closed-swings':'<path d="M34 213L57 63H161L190 213M79 65V170M141 65V170" fill="none" stroke="#879b9f" stroke-width="7"/><rect x="74" y="169" width="73" height="12" rx="4" fill="#b39aca"/><path d="M24 183H200M24 212V168M200 212V168" stroke="#d3b372" stroke-width="10" stroke-linecap="round"/>' ,

    bubbles:'<g fill="#d8eef1" stroke="#67939e" stroke-width="3"><circle cx="77" cy="83" r="28"/><circle cx="145" cy="48" r="18"/><circle cx="152" cy="123" r="35"/></g><g fill="none" stroke="#fffef3" stroke-width="5" stroke-linecap="round"><path d="M58 78Q60 63 74 62M130 119Q132 102 149 101"/></g><path d="M63 165L63 204" stroke="#88709e" stroke-width="7"/><circle cx="63" cy="153" r="14" fill="none" stroke="#88709e" stroke-width="6"/><rect x="104" y="180" width="30" height="42" rx="6" fill="#d6b45c"/>',
    rain:'<rect x="37" y="36" width="142" height="156" rx="7" fill="#dfebee" stroke="#81949a" stroke-width="7"/><path d="M108 39V190M40 116H176" stroke="#81949a" stroke-width="5"/><g stroke="#7496ac" stroke-width="4" stroke-linecap="round"><path d="M63 61L58 72M91 83L86 94M142 58L137 69M161 89L156 100M69 136L64 147M147 152L142 163"/></g><path d="M47 207V187H74V217H42Q37 210 47 207M101 207V187H128V217H96Q91 210 101 207" fill="#c9a656"/>',
    book:'<rect x="24" y="85" width="174" height="109" rx="28" fill="#c8b6dc"/><rect x="40" y="111" width="144" height="92" rx="22" fill="#a28ab9"/><path d="M51 203V225M171 203V225" stroke="#795e4d" stroke-width="8"/><path d="M54 128Q80 115 111 128Q140 115 167 128V180Q137 168 111 181Q83 168 54 180Z" fill="#fff8d9" stroke="#8e7845" stroke-width="3"/><path d="M111 129V177" stroke="#8e7845" stroke-width="3"/><path d="M69 145H96M69 154H90M126 144H151M126 153H150" stroke="#9caa8a" stroke-width="3"/>',
    tower:'<g stroke="#79645f" stroke-width="3"><rect x="49" y="166" width="42" height="43" rx="4" fill="#d9b5d8"/><rect x="49" y="122" width="42" height="43" rx="4" fill="#efd07a"/><rect x="106" y="165" width="42" height="43" rx="4" fill="#9bc9b8" transform="rotate(23 127 186)"/><rect x="153" y="181" width="42" height="27" rx="4" fill="#a8c8e0"/></g>',
    music:'<rect x="36" y="128" width="154" height="82" rx="16" fill="#d7c0e4" stroke="#80658f" stroke-width="4"/><circle cx="72" cy="169" r="23" fill="#fff8df" stroke="#80658f" stroke-width="4"/><circle cx="154" cy="169" r="23" fill="#fff8df" stroke="#80658f" stroke-width="4"/><path d="M79 126V113Q79 103 90 103H137Q148 103 148 113V126" fill="none" stroke="#80658f" stroke-width="6"/><g fill="#547f80"><path d="M77 50V90H84V60L114 53V79H121V40Z"/><ellipse cx="72" cy="91" rx="12" ry="8"/><ellipse cx="109" cy="80" rx="12" ry="8"/></g>',
    swimming:'<rect x="22" y="132" width="180" height="78" rx="16" fill="#b7dfe7"/><g stroke="#698fa4" stroke-width="3" fill="none"><path d="M30 159Q44 148 58 159T86 159T114 159T142 159T170 159T198 159M30 185Q44 174 58 185T86 185T114 185T142 185T170 185T198 185"/></g><path d="M50 73V150M94 73V150M50 95H94M50 119H94" stroke="#7b8589" stroke-width="7" stroke-linecap="round"/><ellipse cx="157" cy="107" rx="31" ry="16" fill="#e7bc72"/><ellipse cx="157" cy="107" rx="16" ry="7" fill="#fffbe7"/>',
    flowers:'<path d="M111 177V83M111 147Q72 143 74 120Q103 118 111 147M111 133Q149 130 149 105Q118 106 111 133" fill="#8eb37c" stroke="#67875b" stroke-width="4"/><g fill="#dec0da"><circle cx="111" cy="52" r="20"/><circle cx="87" cy="71" r="20"/><circle cx="96" cy="98" r="20"/><circle cx="126" cy="98" r="20"/><circle cx="136" cy="71" r="20"/></g><circle cx="111" cy="77" r="17" fill="#e7bd5e"/><path d="M69 169H151L140 219H80Z" fill="#c88f75"/><rect x="65" y="164" width="90" height="14" rx="5" fill="#dbab8a"/>',
    'song-ended':'<rect x="36" y="128" width="154" height="82" rx="16" fill="#d7c0e4" stroke="#80658f" stroke-width="4"/><circle cx="72" cy="169" r="23" fill="#fff8df" stroke="#80658f" stroke-width="4"/><circle cx="154" cy="169" r="23" fill="#fff8df" stroke="#80658f" stroke-width="4"/><path d="M79 126V113Q79 103 90 103H137Q148 103 148 113V126" fill="none" stroke="#80658f" stroke-width="6"/><rect x="102" y="158" width="18" height="18" rx="3" fill="#80658f"/>',
    rest:'<path d="M103 217L106 100H127L134 217Z" fill="#ad8261"/><path d="M117 147L84 114M118 125L147 94" stroke="#ad8261" stroke-width="9"/><g fill="#adc99a"><circle cx="79" cy="80" r="44"/><circle cx="126" cy="51" r="42"/><circle cx="157" cy="91" r="41"/><circle cx="115" cy="107" r="39"/></g><ellipse cx="109" cy="224" rx="87" ry="13" fill="#d0c4de"/>',
    zip:'<path d="M78 63L45 77L24 128L52 143L68 115V213H162V115L180 143L207 128L183 77L150 63L115 80Z" fill="#adc8dc" stroke="#688397" stroke-width="3"/><path d="M78 63L96 95L115 81L134 95L150 63" fill="#d3e2eb" stroke="#688397" stroke-width="3"/><path d="M115 211V147M115 115L103 94M115 115L126 94" fill="none" stroke="#56657a" stroke-width="4"/><path d="M108 145H121V165H108Z" fill="#efd17b" stroke="#907e49" stroke-width="3"/><path d="M79 172H98M132 172H151" stroke="#688397" stroke-width="3"/>',
    picnic:'<path d="M28 182H190L208 226H12Z" fill="#c4d5ad"/><path d="M60 133H165L155 210H70Z" fill="#d4af75" stroke="#94794f" stroke-width="3"/><path d="M84 134V107Q112 71 141 107V134" fill="none" stroke="#94794f" stroke-width="8"/><path d="M71 153H155M73 174H155M91 138V201M116 138V204M141 138V200" stroke="#b28d58" stroke-width="3"/><path d="M162 94Q142 74 144 57Q162 53 175 72Q192 55 201 68Q211 87 186 101Z" fill="#dba0a0"/><path d="M175 72Q168 59 178 47" stroke="#739564" stroke-width="4" fill="none"/>',
    slide:'<path d="M53 213V77H100M53 180H93M53 151H93M53 121H93M93 77V215" fill="none" stroke="#8396aa" stroke-width="8"/><path d="M93 83H120Q129 164 181 188L201 191V211Q127 212 102 102H93Z" fill="#d9ba6b" stroke="#9a8248" stroke-width="3"/><path d="M90 81V58H122V80" stroke="#9a8248" stroke-width="6" fill="none"/>'
  };
  function scene(story){
    if(!scenes[story.scene])throw Error('Missing scene '+story.scene);
    const reading=story.scene==='book';
    const portrait=svg(story.person,story.expression,{decorative:true,pose:true}).replace('<svg ', `<svg x="${reading?125:233}" y="6" width="220" height="260" `);
    let setting=`<g transform="translate(5 13)">${scenes[story.scene]}</g>`,foreground='';
    if(reading){
      setting='<rect x="148" y="127" width="174" height="110" rx="28" fill="#c8b6dc"/><rect x="144" y="180" width="30" height="66" rx="12" fill="#a28ab9"/><rect x="296" y="180" width="30" height="66" rx="12" fill="#a28ab9"/>';
      foreground='<path d="M182 191Q208 181 235 191Q262 181 288 191V230Q260 220 235 230Q208 220 182 230Z" fill="#fff8d9" stroke="#8e7845" stroke-width="3"/><path d="M235 193V226M195 204H222M250 204H276M195 213H215M250 213H272" stroke="#9caa8a" stroke-width="3"/>';
    }else if(story.scene==='rest'){
      setting='<path d="M155 252L161 78H188L196 252Z" fill="#ad8261"/><g fill="#adc99a"><ellipse cx="139" cy="75" rx="78" ry="61"/><ellipse cx="229" cy="52" rx="91" ry="46"/><ellipse cx="302" cy="67" rx="94" ry="49"/></g><ellipse cx="295" cy="250" rx="118" ry="17" fill="#d0c4de"/>';
    }
    return `<svg class="story-art" viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(story.context+' '+F.statement(story))}" data-scene="${story.scene}"><ellipse cx="238" cy="253" rx="216" ry="17" fill="#e8e5ce"/>${setting}${portrait}${foreground}</svg>`;
  }
  const api={svg,scene};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NookFeelingsArt=api;
})(typeof window!=='undefined'?window:globalThis);

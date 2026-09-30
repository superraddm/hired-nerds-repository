"""Author the varied third revision. Each bay has its own topology, not a repeated template."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
path=ROOT/'public/fireworks/mike-game/level-1.json'
d=json.loads(path.read_text())
backup=ROOT/'docs/mike-platformer/level-1-nightshift-v2.json'
if not backup.exists():backup.write_text(json.dumps(d,indent=1)+'\n')
old=json.loads(backup.read_text())
d=old
d.update(version=3,id='nightshift-encounters-v3',collection={'name':'Salvage','total':56,'types':['bearing','seal','coupling','controlUnit']})
def bay(n,title,width,floors,platforms,route):
    return dict(id=f'night-{n}',title=title,x=0,width=width,solids=[[a,12,b-a,5] for a,b in floors],
        platforms=[[x,y,w,.4] for x,y,w in platforms],pits=[[a[1],b[0]] for a,b in zip(floors,floors[1:]) if b[0]>a[1]],
        hazards=[],pickups=[],belts=[],decor=[],route=route)
def rail(s,id,x,y,span,phase=0,cycle=6):
    # Cutting tip crosses Mike's body one tile above the walkway; the return clears his head.
    s['hazards'].append(dict(id=id,type='railSpindle',rect=[x,y-5.6,span,2],cycle=cycle,phase=phase))
def coolant(s,id,x,top,phase):
    s['hazards'].append(dict(id=id,type='coolant',base=[x-1,10,1,2],jet=[x,top,2,12-top],cycle=3.8,phase=phase))
def gate(s,id,x,kind='jaws',phase=0):
    s['solids'].append([x,0,3,9.6]);s['hazards'].append(dict(id=id,type=kind,rect=[x,9.6,3,2.4],cycle=3.8,phase=phase,open=[3.2,3.8],ready=.45,lanes=[10.5,11.5]))

# 1. The floor is genuinely missing. A stepped bridge and a higher crane route cross the void.
s1=bay(1,'The broken bridge',64,[(0,18),(51,64)],
 [(12,9.8,4),(18,7.6,4),(25,5.4,5),(34,5.4,4),(42,7.6,4),(48,9.8,4),
  (23,3.2,3),(27,1,3),(33,1,3),(39,3.2,3)],
 [[14,9.8],[20,7.6],[27,5.4],[36,5.4],[44,7.6],[50,9.8],[60,12]])
rail(s1,'bridge-head',29,5.4,12,cycle=6.4)

# 2. Alternating raised conveyors climb over a solid nine-tile-high transfer bed.
s2=bay(2,'Cross-feed climb',64,[(0,64)],
 [(8,9.8,5),(15,7.6,5),(22,5.4,5),(38,5.4,4),(45,7.6,4),(52,9.8,4),
  (22,3.2,3),(26,1,3),(31,-1.2,4),(39,1,4)],
 [[10,9.8],[17,7.6],[24,5.4],[32,3.2],[40,5.4],[47,7.6],[60,12]])
s2['solids'].append([29,3.2,7,8.8])
for j,(x,y) in enumerate([(8,9.8),(15,7.6),(22,5.4),(38,5.4)]):
    s2['belts'].append(dict(id=f'raised-belt-{j}',at=[x,x+(5 if j<3 else 4)],y=y,dir=(-1)**j,speed=2.5,reverse=3.5))
rail(s2,'transfer-head',28,3.2,14,.8)

# 3. A deliberate ground-level timing encounter with different machine types and staggered signals.
s3=bay(3,'The press gauntlet',56,[(0,56)],[(7,9.8,3),(7,7.6,3),(11,5.4,3),(7,3.2,3),(11,1,3),(14,-1.2,4),(21,-1.2,3),(26,1,3)],[[52,12]])
gate(s3,'press-one',15,phase=0);gate(s3,'press-two',33,'spitterGallery',phase=1.9)

# 4. A switchback tower reverses horizontal travel during the climb; the roof route crosses the trench.
s4=bay(4,'Switchback tower',72,[(0,24),(57,72)],
 [(16,9.8,5),(23,7.6,4),(18,5.4,4),(25,3.2,4),(20,1,4),(27,-1.2,4),
  (33,-3.4,5),(42,-3.4,4),(49,-1.2,4),(54,1,4),(60,5.4,4),
  (39,-5.6,3),(45,-5.6,3)],
 [[18,9.8],[25,7.6],[20,5.4],[27,3.2],[22,1],[29,-1.2],[35,-3.4],[44,-3.4],[51,-1.2],[56,1],[62,5.4],[68,12]])
rail(s4,'tower-head',35,-3.4,14,1.5,7)

# 5. Offset coolant columns create timed hops across tank islands; a high, narrow route avoids the fluid.
s5=bay(5,'Coolant reservoirs',80,[(0,19),(31,36),(48,53),(65,80)],
 [(12,9.8,4),(20,9.8,4),(27,9.8,4),(37,7.6,4),(44,7.6,4),(54,9.8,4),(61,9.8,4),
  (10,7.6,3),(14,5.4,3),(18,3.2,3),(23,1,3),(29,1,4),(37,1,4),(45,1,4),(53,3.2,4),(60,5.4,4)],
 [[14,9.8],[22,9.8],[29,9.8],[33,12],[39,7.6],[46,7.6],[50,12],[56,9.8],[63,9.8],[74,12]])
# The 4.4T climb from the island needs a launch shelf.
s5['platforms'] += [[34,9.8,3,.4],[51,9.8,3,.4]]
s5['route'].insert(4,[35.5,9.8])
coolant(s5,'reservoir-a',24,7.2,0);coolant(s5,'reservoir-b',41,5.2,1.9);coolant(s5,'reservoir-c',58,7.2,.8)

# 6. One real moving service lift, a hanging bridge and a higher optional branch.
s6=bay(6,'The service lift',64,[(0,20),(52,64)],
 [(9,9.8,4),(23,1,5),(32,1,4),(40,3.2,4),(47,7.6,4),
  (26,-1.2,3),(31,-3.4,3),(37,-3.4,3),(44,-1.2,3)],
 [[11,9.8],{'lift':'service-lift'},[25,1],[34,1],[42,3.2],[49,7.6],[60,12]])
s6['lifts']=[dict(id='service-lift',at=[15,9.8],to=[15,1],w=4,cycle=9,phase=0)]
rail(s6,'lift-bridge-head',28,1,14,2.1,6.8)

# 7. A low ceiling changes the jump rhythm; the roof is an optional counter-route.
s7=bay(7,'The chip tunnel',56,[(0,19),(22,33),(36,56)],
 [(4,9.8,3),(7,7.6,3),(4,5.4,3),(8,3.2,3),(47,7.6,4)],
 [[17,12],[25,12],[31,12],[40,12],[52,12]])
s7['solids'].append([12,4,33,5])
s7['belts']=[dict(id='tunnel-belt',at=[24,31],dir=-1,speed=2.5,reverse=3)]
s7['hazards']=[dict(id='tunnel-lathe',type='spitter',rect=[47,10,2,2],face=-1,mouth=11.25,catch=39,cycle=3,phase=1.3)]
s7['route'].insert(-1,[49,7.6])
s7['route'].insert(-2,[48,10])

# 8. The paired heads have overlapping working strokes and visibly raised returns.
s8=bay(8,'Opposed traverses',64,[(0,17),(49,64)],
 [(10,9.8,4),(17,7.6,4),(24,5.4,5),(33,5.4,5),(42,7.6,4),
  (20,3.2,3),(25,1,3),(32,1,3),(39,3.2,3)],
 [[12,9.8],[19,7.6],[26,5.4],[35,5.4],[44,7.6],[57,12]])
rail(s8,'opposed-a',23,5.4,11,0,7);rail(s8,'opposed-b',32,5.4,11,3.5,7)

# 9. Traverse the tops of solid stepped machine beds, with a backtracking secret shelf.
s9=bay(9,'The mill spine',64,[(0,64)],
 [(8,9.8,4),(20,5.4,4),(26,3.2,4),(37,3.2,4),(44,5.4,4),(53,9.8,4),
  (22,1,3),(26,-1.2,3),(32,-3.4,4),(39,-1.2,4),
  (23,-3.4,3),(19,-5.6,3),(13,-5.6,3.2)],
 [[10,9.8],[17,7.6],[22,5.4],[28,3.2],[34,1],[39,3.2],[46,5.4],[50,7.6],[59,12]])
s9['solids'] += [[14,7.6,6,4.4],[31,1,5,11],[47,7.6,5,4.4]]
rail(s9,'spine-head',28,1,15,1.2,7)
s9['secret']=[12,-8,5,3]
s9['pickups'].append(dict(id='secret-mini-mike',type='miniMike',at=[14.5,-6.7],hidden=True))

# 10. A final continuous crossing combines a conveyor launch, a drop and an exit press.
s10=bay(10,'The last transfer',56,[(0,15),(38,56)],
 [(10,9.8,4),(17,7.6,4),(24,5.4,4),(32,7.6,4),(38,9.8,4),
  (22,3.2,3),(28,1,3),(34,3.2,3)],
 [[12,9.8],[19,7.6],[26,5.4],[34,7.6],[40,9.8],[53,12]])
s10['belts']=[dict(id='final-launch',at=[10,14],y=9.8,dir=1,speed=2.4,reverse=4)]
gate(s10,'final-press',45,phase=.7)
sectors=[s1,s2,s3,s4,s5,s6,s7,s8,s9,s10]
x=276
for i,s in enumerate(sectors):
    s['x']=x;x+=s['width']
    # Four salvage pieces per bay, split between main progression and optional branches.
    shelves=s['platforms']; picks=[shelves[0],shelves[len(shelves)//3],shelves[-2],shelves[-1]]
    for j,p in enumerate(picks):s['pickups'].append(dict(id=f'v3-salvage-{i}-{j}',type=['bearing','seal','coupling'][(i+j)%3],at=[p[0]+p[2]/2,p[1]-1]))
    if i in (3,7):
        p=min(shelves,key=lambda p:p[1]);s['pickups'].append(dict(id=f'v3-unit-{i}',type='controlUnit',at=[p[0]+p[2]/2,p[1]-1]))
    if i in (0,3,5,8):
        p=min(shelves,key=lambda p:p[1]);s['pickups'].append(dict(id=f'v3-sd-{i}',type='sdCard',at=[p[0]+.5,p[1]-1]))
    if i in (2,4,7):s['pickups'].append(dict(id=f'v3-lube-{i}',type='lubricant',at=[s['width']-4,11]))
d['sections']=d['sections'][:8]+sectors+d['sections'][-2:]
# The bench no longer dispenses repair inventory, nor claims a recipe.
for s in d['sections']:
    s['decor']=[a for a in s.get('decor',[]) if a['type'] not in ('dispenser','recipeBoard')]
d['checkpoints']=[[2,12],[102,12],[206,12]]+[[s['x']+2,12] for s in sectors[::2]]+[[937,12]]
d['boss'].update(recipe={},hold=3.2)
d['recovery']=None
assert x==916
assert sum(p['type'] in d['collection']['types'] for s in d['sections'] for p in s.get('pickups',[]))==56
path.write_text(json.dumps(d,indent=1)+'\n')
print('Authored ten distinct bays; 56 salvage items; three tool-based repairs; moving service lift.')

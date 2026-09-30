"""Deterministic authored expansion. Run once against the original 320-tile level."""
import copy
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
target = root / 'public/fireworks/mike-game/level-1.json'
d = json.loads(target.read_text())
if d['size'][0] != 320:
    raise SystemExit('Expansion already applied; edit level-1.json directly.')
(root / 'docs/mike-platformer/level-1-original.json').write_text(json.dumps(d, indent=2))
d.update(version=2, id='tangled-workshop-nightshift', title='The Night Shift', size=[960, 17], minY=-12)
titles = ['Foundry crossing', 'The spindle gallery', 'Tool-change towers', 'Coolant cathedral',
          'The forgotten stores', 'Cross-feed chasm', 'The long gantry', 'Night-shift turning',
          'Pressure cascade', 'The final approach']
# Each sector has an authored floor route and a linked elevated route. Narrow gaps and
# 2.2T climbs stay inside the measured 3T / 7T jump envelope. Checkpoints remain on floor.
pitsets = [[(22,26),(42,46)],[(31,35)],[(18,22),(44,48)],[(27,31),(49,53)],
           [(34,38)],[(18,22),(30,34),(44,48)],[(24,28),(40,44)],[(20,24),(46,50)],
           [(28,32),(43,47)],[(20,24),(35,39),(50,54)]]
sectors=[]
for i,title in enumerate(titles):
    x=276+i*64
    s=dict(id='night-'+str(i+1),title=title,x=x,width=64,solids=[],platforms=[],pits=pitsets[i],hazards=[],pickups=[],belts=[],decor=[])
    edge=0
    for a,b in pitsets[i]:
        s['solids'].append([edge,12,a-edge,5]);edge=b
    s['solids'].append([edge,12,64-edge,5])
    # Continuous optional maintenance route; every sector can be entered from the floor.
    climbs=[(6,9.8),(10,7.6),(14,5.4),(18,3.2),(22,1),(26,-1.2)]
    for px,py in climbs:s['platforms'].append([px,py,3.2,.4])
    route=[(31,-1.2),(38,-1.2),(45,-1.2),(52,1),(57,3.2),(60,5.4)]
    if i in (2,3,6):
        route=[(30,-3.4),(34,-5.6),(39,-5.6),(46,-5.6),(51,-3.4),(55,-1.2),(59,1),(61,3.2)]
    for px,py in route:s['platforms'].append([px,py,3.2 if py < -3 else 3.8,.4])
    # Lower shelf route provides cover, recovery and launch points without removing pits.
    for px in (16,36,54):s['platforms'].append([px,9.6,3.2,.4])
    s['hazards'].append(dict(id=f'rail-{i}',type='railSpindle',rect=[30 if i%2 else 36,-11 if i in (2,3,6) else -6.6,12,2],cycle=4.6,phase=i*.43))
    if i in (1,4,7):
        s['hazards'].append(dict(id=f'lathe-{i}',type='spitter',rect=[55,10,2,2],face=-1,mouth=11.25,catch=48,cycle=2.6,phase=i*.3))
    elif i in (3,8):
        for j,px in enumerate((36,56)):
            s['hazards'].append(dict(id=f'coolant-{i}-{j}',type='coolant',base=[px,10,1,2],jet=[px+1,8.8,2,3.2],cycle=3.1,phase=j*1.55))
    else:
        s['hazards'].append(dict(id=f'floor-rail-{i}',type='railSpindle',rect=[51,7.5,8,3],cycle=4.2,phase=.8))
    if i in (0,5,6,9):
        a,b=pitsets[i][0]
        s['belts'].append(dict(id=f'cross-feed-{i}',at=[max(10,a-7),a],dir=-1,speed=2.2,reverse=3.6))
    for j,(px,py) in enumerate([(12,10.9),(28,-2.3),(41,-6.7 if i in (2,3,6) else -2.3),(59,10.9)]):
        kind=['bearing','seal','coupling'][(i+j)%3]
        s['pickups'].append(dict(id=f'new-part-{i}-{j}',type=kind,at=[px,py]))
    if i in (1,3,6,8):s['pickups'].append(dict(id=f'new-sd-{i}',type='sdCard',at=[47,-6.7 if i in (3,6) else -2.3]))
    if i in (2,5,9):s['pickups'].append(dict(id=f'new-oil-{i}',type='lubricant',at=[56,8.6]))
    if i in (4,7):s['pickups'].append(dict(id=f'new-unit-{i}',type='controlUnit',at=[39,-2.3]))
    if i==4:
        # A backtracking loft, concealed behind a slatted service grille. No floor pickup.
        s['platforms'] += [[23,-3.4,3,.4],[19,-5.6,3,.4],[13,-5.6,3.2,.4]]
        s['pickups'].append(dict(id='secret-mini-mike',type='miniMike',at=[14.5,-6.7],hidden=True))
        s['secret']=[12,-8,5,3]
    sectors.append(s)
for s in d['sections']:
    s['pickups']=[p for p in s.get('pickups',[]) if p['type']!='miniMike']
    if s['x']>=276:s['x']+=640
# Branch early: climb onto the housings and cross above the original camera gates.
for idx in (2,4,7):
    s=d['sections'][idx]
    s.setdefault('platforms',[]).extend([[2,9.8,3,.4],[5,7.6,3,.4],[8,5.4,3,.4],
        [5,3.2,3,.4],[8,1,3,.4],[11,-1.2,4,.4],[18,-1.2,4,.4],[25,1,4,.4]])
    s.setdefault('hazards',[]).append(dict(id=f'upper-rail-{idx}',type='railSpindle',rect=[13,-6.6,12,2],cycle=4.6,phase=0))
d['sections']=d['sections'][:8]+sectors+d['sections'][8:]
d['sections'][-1]['title']='The Five-Axis Fault'
d['checkpoints']=[[2,12],[102,12],[206,12]]+[[278+i*128,12] for i in range(5)]+[[937,12]]
d['recovery']['at'][0]+=640
b=d['boss']; b['bounds'][0]+=640;b['drum'][0]+=640;b['console'][0]+=640
for s in b['sockets']:s[0]+=640
for s in b['safeLanes']:s[0]+=640;s[1]+=640
b['name']='The Five-Axis Fault'; b['hold']=1.7
b['timeline']=dict(tell=.75,extend=.6,sweep=1.8,retract=.75,park=1.1)
target.write_text(json.dumps(d,indent=1)+'\n')
print('Built 960 tiles, 20 sectors, 9 checkpoints, concealed loft, two route families.')

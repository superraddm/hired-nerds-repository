/* Original game logic. No dependencies or borrowed game assets. */
(function(root){
  'use strict';
  const SHAPES=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]]];
  const copy=value=>JSON.parse(JSON.stringify(value));
  function shuffle(items,rng=Math.random){const out=items.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
  function rotate(matrix){return matrix[0].map((_,x)=>matrix.map(row=>row[x]).reverse());}
  function emptyBoard(){return Array.from({length:20},()=>Array(10).fill(0));}
  function fits(board,piece){return piece.matrix.every((row,y)=>row.every((v,x)=>!v||(piece.x+x>=0&&piece.x+x<10&&piece.y+y>=0&&piece.y+y<20&&!board[piece.y+y][piece.x+x])));}
  function clearLines(board){const remaining=board.filter(row=>row.some(v=>!v));const cleared=20-remaining.length;while(remaining.length<20)remaining.unshift(Array(10).fill(0));return {board:remaining,cleared};}
  class Blocks{
    constructor(rng=Math.random){this.rng=rng;this.reset();}
    drawId(){if(!this.bag.length)this.bag=shuffle([0,1,2,3,4,5,6],this.rng);return this.bag.pop();}
    spawn(id){const matrix=copy(SHAPES[id]);return {id,matrix,x:Math.floor((10-matrix[0].length)/2),y:0};}
    reset(){this.board=emptyBoard();this.bag=[];this.rows=0;this.full=false;this.previous=null;this.active=this.spawn(this.drawId());this.next=this.drawId();}
    move(dx,dy){if(this.full)return false;const moved={...this.active,x:this.active.x+dx,y:this.active.y+dy};if(!fits(this.board,moved))return false;this.active=moved;return true;}
    turn(){if(this.full)return false;const matrix=rotate(this.active.matrix);for(const dx of [0,-1,1,-2,2]){const p={...this.active,matrix,x:this.active.x+dx};if(fits(this.board,p)){this.active=p;return true;}}return false;}
    landing(){const p=copy(this.active);while(fits(this.board,{...p,y:p.y+1}))p.y++;return p;}
    place(){if(this.full)return 0;this.previous=copy({board:this.board,active:this.active,next:this.next,bag:this.bag,rows:this.rows});this.active=this.landing();this.active.matrix.forEach((row,y)=>row.forEach((v,x)=>{if(v)this.board[this.active.y+y][this.active.x+x]=this.active.id+1;}));const result=clearLines(this.board);this.board=result.board;this.rows+=result.cleared;this.active=this.spawn(this.next);this.next=this.drawId();this.full=!fits(this.board,this.active);return result.cleared;}
    undo(){if(!this.previous)return false;Object.assign(this,copy(this.previous));this.previous=null;this.full=false;return true;}
  }
  const WORDS=[{word:'CAT',picture:'🐈'},{word:'SUN',picture:'☀'},{word:'DOG',picture:'🐕'},{word:'BUS',picture:'🚌'},{word:'HAT',picture:'🎩'},{word:'CUP',picture:'☕'},{word:'BED',picture:'🛏'},{word:'PIG',picture:'🐖'},{word:'APPLE',picture:'🍎'},{word:'MOON',picture:'☾'}];
  const symbols=['circle','square','triangle','diamond'];
  function puzzle(mode,index,settings){
    const supported=settings.level==='supported';const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(v=>settings.case==='lower'?v.toLowerCase():v);let tokens,filled,picture='',title,label,pool;
    if(mode==='letters'){tokens=[alphabet[index%26]];filled=0;title='Find the same letter';label='LETTER '+(index%26+1)+' OF 26';pool=alphabet;}
    else if(mode==='numbers'){const max=Number(settings.range)||5;const size=Math.min(max,5);const start=(index*size)%max+1;tokens=Array.from({length:Math.min(size,max-start+1)},(_,i)=>String(start+i));filled=supported?0:Math.max(1,tokens.length-2);title='Put the numbers in order';label='NUMBER SEQUENCE';pool=Array.from({length:max},(_,i)=>String(i+1));}
    else if(mode==='words'){const entry=WORDS[index%WORDS.length];tokens=entry.word.split('').map(v=>settings.case==='lower'?v.toLowerCase():v);filled=0;picture=entry.picture;title='Build the word';label=entry.word;pool=alphabet;}
    else if(mode==='patterns'){const a=symbols[index%4],b=symbols[(index+1)%4];tokens=!supported&&index%2?[a,a,b,a,a,b]:[a,b,a,b];filled=tokens.length-1;title='What comes next?';label='PATTERN PLAY';pool=symbols;}
    else{const n=index%Math.min(Number(settings.range)||5,10)+1;tokens=[String(n)];filled=0;picture=n;title='How many dots?';label='COUNT TOGETHER';pool=Array.from({length:Math.min(Number(settings.range)||5,10)},(_,i)=>String(i+1));}
    return {mode,tokens,filled,picture,title,label,pool,supported,done:false};
  }
  function choicesFor(p,level,rng=Math.random){const answer=p.tokens[p.filled];const count=level==='supported'?2:3;const alternatives=shuffle(p.pool.filter(v=>v!==answer),rng).slice(0,count-1);return shuffle([answer,...alternatives],rng);}
  const api={Blocks,SHAPES,rotate,fits,clearLines,emptyBoard,puzzle,choicesFor};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LittlePatterns=api;
})(typeof window!=='undefined'?window:globalThis);

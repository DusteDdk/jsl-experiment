#!/usr/bin/node

const prg = require(process.argv[2]);

const callStack = [];
const stackDump = ()=>{

	const topScope = {};
	
	callStack.forEach( (v,i )=>{
		const pad = ((i<10)?' ':'') + i + ' '+ Array(i).fill(' ').join('');
		const scope = JSON.parse(v.scope);
		const scopeDiff={};
		Object.keys(scope).forEach( k=>{
			if(JSON.stringify(scope[k]) !== JSON.stringify(topScope[k]) && scopeDiff[k] == undefined) {
				scopeDiff[k] = scope[k];
				topScope[k] = scope[k];
			}

		});
		console.log(pad+JSON.stringify(scopeDiff))
		console.log(pad+v.form);
	});

	return 0;
};

const run = ([fun, ...args]) => {

	if( Array.isArray(fun)) {
		stackDump();
	};

	if(fun==="'") {
		return args;
	}

	if(fun.length>0 && fun[0] == '#') {
		return;
	}

	if(!funs[fun]) {
		stackDump();
		throw new Error(`No function '${fun}' `);
	}

	const margs = args.map( arg=> {
		if(Array.isArray(arg)) {
			callStack.push( {
				form: JSON.stringify(arg),
				scope: JSON.stringify(scopes[0])});
			const ret = run(arg);
			callStack.pop();
			return ret;
		} else {
			if(typeof arg === 'string' && arg.length > 0) {
				if(arg[0] !== '\'') {
					const found = scopes.find( s=>s[arg]!==undefined);
					if(found) {
						return found[arg];
					};
					stackDump();
					throw new Error(`Unknown var '${arg}'`);
					
				}
				return arg.substring(1);

			}
			return arg;
		}
	});

	return funs[fun](margs);
	
};

function print(args) {
	const str = args.join('');
	console.log(str);
	return str;
}

function sum(args) {
	return args.reduce( (a,c,)=>a+c, 0);
}

function subtract([first, ...args]) {
	return args.reduce( (a,c)=>a-c, first);
}

function cond( [bool, prgs] ) {
	return run(prgs[(bool)?0:1]);
}

function list(args) {
	return [[args]];
};

const def = ([name, val])=>{
	scope[name]=val;
	return `${name}=${val}`;
};

const vars = ()=>{
	console.log('--Vars--');
	console.log( JSON.stringify(scope, null, 4));
};

const nth = ([idx, list]) =>{
	return list[idx];
}

const spread = ([fun, args]) => {
	if(!funs[fun]) {
		throw new Error(`Cannot spread argument list to nonexisting function ${fun}.`);
	}
	return funs[fun](args);
};

const fun = ([fname, args, program])=>{
	program.unshift('form');
	funs[fname] = (cargs) =>{
		const fscope = {};
		args.forEach( (v,i)=>{
			fscope[v] = cargs[i];
		});

		scopes.unshift(fscope);
		const r = run(program);
		scopes.shift();

		return r;
	};
	funs[fname]._jslArgs=args;
	return `function ${fname} ( ${args.join()} ) => ${JSON.stringify(program)}`;
};

const gt = ([a,b])=>{
	return a > b;
};

const lt = ([a,b])=>{
	return a < b;
};

const eq = ([a,b])=>{
	return a===b;
};

const neq = ([a,b])=>{
	return  a!==b;
};

const exec = (prg)=>{
	return run(['form', ...prg[0]]);
};

const funs = {
	print,
	'+': sum,
	'-': subtract,
	cond,
	list,
	def,
	form,
	vars,
	nth,
	spread,
	fun,
	gt,
	lt,
	eq,
	neq,
	list,
	exec,
	stack: stackDump,
};

function list(args) {
	return args;
}

function form(args) {
	return args.pop();;
}

const scope = {
	args:[],
};

for(let i=0; i < process.argv.length; i++) {
	if(i > 1) {
		const arg = process.argv[i];
		const asInt = parseInt(arg);
		scope.args.push ( (isNaN(asInt))?arg:asInt );
	}
}

const scopes = [scope];

run(prg);
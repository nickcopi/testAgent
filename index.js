const request = require('request-promise');
const fs = require('fs');
const schedule = require('node-schedule');
const Shell = require('node-powershell');
const greenGuy = 'http://localhost:8080';
const mkdirp = require('mkdirp');

let installing = null;

let buildTime = async ()=>{
	const pkgPath = `${__dirname}/packages/`;
	let queue = JSON.parse(await request(greenGuy + '/getTestQueue').catch(e=>console.log(e)));
	console.log(queue);
	let target;
	if(installing) return console.log(`Ignoring queue, must finish installing ${installing}.`);
	for(const q of queue){
		if(target) continue;
		if(q.dibs) continue;
		const dibsStatus = JSON.parse(await callDibs(q.name));
		if(!dibsStatus.success) continue;
		target = q;
	}
	if(!target) return;
	console.log(target);
	const pkgName =`${target.name}.${target.version}.nupkg`; 
	const options = {
		encoding:null,
		url:`${greenGuy}/packages/${target.name}/${pkgName}`
	}
	let data = await request(options).catch(e=>console.log(e));
	mkdirp.sync(pkgPath);
	fs.writeFileSync(pkgPath + pkgName,data);
	installing = target.name;
	try{
		const ps = new Shell({
			executionPolicy:'Bypass',
			noProfile:true
		});
		ps.addCommand(`choco install --no-progress --force -y ${pkgName}`);
		console.log(`Trying to install ${target.name}.`);
		const result = await ps.invoke();
		ps.dispose();
		let success = didInstall(result);
		sendReport(target.name,success,null,result);
	}catch(e){
		console.log(e);
		sendReport(target.name,false,e,e);
	}
	console.log('Done');
	buildTime();

}
let sendReport = (name,success,error,result)=>{
	installing = null;
	console.log(result);
	const options = {
		method:'POST',
		url:greenGuy + '/agentReport',
		headers:{
			'Content-Type':'application/json'
		},
		body:JSON.stringify({
			error,
			success,
			name,
			result
		})
	}
	request(options).catch(e=>console.log(e));
}
let didInstall = result=>{
	let success = false;
	result.split('\n').forEach(l=>{
		if(l.includes('Chocolatey installed ')){
			l.split(' ').forEach(w=>{
				if(w.includes('/')){
					if(w.split('/')[0] === w.split('/')[1]) success = true;
					if(w.split('/')[0] == 0) success = false;
				}
			});
		}
	});
	return success;
}
let callDibs = async name =>{
	console.log('calling dibs on ' + name);
	const options = {
		method:'POST',
		url:greenGuy + '/agentDibs',
		headers:{
			'Content-Type':'application/json'
		},
		body:JSON.stringify({
			name,
		})
	}
	let res = await request(options).catch(e=>console.log(e));
	return res;


}
let startSchedule = ()=>{
	schedule.scheduleJob('* * * * *',()=>{
		buildTime();
	});
};
buildTime();
startSchedule();


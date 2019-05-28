const request = require('request-promise');
const fs = require('fs');
const schedule = require('node-schedule');
const Shell = require('node-powershell');
const greenGuy = 'http://localhost:8080';

let buildTime = async ()=>{
	let queue = JSON.parse(await request(greenGuy + '/getTestQueue'));
	console.log(queue);
	await Promise.all(queue.map( async q=>{
		let name = q.name;
		let version = q.version;
		let pkgName =`${name}.${version}.nupkg`; 
		const options = {
			encoding:null,
			url:`${greenGuy}/packages/${name}/${pkgName}`
		}
		let data = await request(options).catch(e=>console.log(e));
		fs.writeFileSync(pkgName,data);
		return q;
	}));
	await Promise.all(queue.map(async q=>{
		const pkgName =`${q.name}.${q.version}.nupkg`; 
		try{
			const ps = new Shell({
				executionPolicy:'Bypass',
				noProfile:true
			});
			ps.addCommand(`choco install --force -y ${pkgName}`);
			const result = await ps.invoke();
			ps.dispose();
			let success = didInstall(result);
			sendReport(q.name,success,null,result);
		}catch(e){
			console.log(e);
			sendReport(q.name,false,e,e);
		}
		return q;
	}));
console.log('Done');

}
let sendReport = (name,success,error,result)=>{
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
	request(options);
}
let didInstall = result=>{
	let success = false;
	result.split('\n').forEach(l=>{
		if(l.includes('Chocolatey installed ')){
			l.split(' ').forEach(w=>{
				if(w.includes('/')){
					if(w.split('/')[0] === w.split('/')[1]) success = true;
				}
			});
		}
	});
	return success;
}
buildTime();

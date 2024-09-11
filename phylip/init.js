export default (() => {
	//const HOST = "http://localhost:8080";
	const HOST = "https://phylip.modoree.kr";

	// command DIV 추가
	function add_cmd(_cmd, popper) {
		let wrap = document.createElement("li");

		let cmd = document.createElement("span");
		cmd.classList.add("cmd");
		cmd.appendChild(document.createTextNode(_cmd));

		cmd.addEventListener("click", e => {			
			let command = e.target.textContent.toUpperCase();
			
			if (command.indexOf(".") > 0) {
				command = command.replace('.EXE', '');
			}
			document.querySelector("#cmd").textContent = command;
			document.querySelector("#modal-body").classList.add("visible");
			
			popper.init();
		});

		wrap.appendChild(cmd);
		return wrap;
	}
	
	return {
		HOST,
		load_cmds: popper => {
			fetch(HOST + "/cmds")
			.then(data => data.json().then(v => {
				let grid = document.querySelector(".grid");
			
				for(let value of v) {
					grid.appendChild(add_cmd(value, popper));
				}
			}))
			.catch(error => console.log(error));
		}
	}
}) ();
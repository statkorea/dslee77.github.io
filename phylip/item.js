export default function(host) {
		//import init from './init';

	const cmd = document.querySelector("#cmd");	
	
	const clear = {
		all: () => {
			clear.s1();
			clear.s2();
			clear.s3();
		},
		s1: () => {
			const s1_body = document.querySelector("#tabs-input");
			const header = s1_body.querySelector(".js-tabs__header");
			
			//clear headers and textareas
			header.querySelectorAll("li").forEach(el => el.remove());

			//clear textareas
			s1_body.querySelectorAll(".js-tabs__content").forEach(el => el.remove());
		},
		s2: () => {
			S2.view("");
			
			document.querySelector("[href='#s3']").style.display = "none";
			document.querySelector("#interact").style.display = "block";
		},
		s3: () => {
			const mesg = document.querySelector("#mesg");
			const table = document.querySelector("#option");
			const into_pipeline = document.querySelector("#into_pipeline");
			const tab_output = document.querySelector("#tabs-output");

			mesg.style.display = "none";
			table.style.display = "none";
			
			//clear mesg
			mesg.textContent = "";
			
			//clear options
			table.innerHTML = "";
			
			//clear headers			
			tab_output.querySelector(".js-tabs__header").querySelectorAll("li").forEach(el => el.remove());

			//clear pre
			tab_output.querySelectorAll(".js-tabs__content").forEach(el => el.remove());			
		},
	}
	
	const init = {
		//command 기준 입력대상 파일목록을 나열한다.
		s1: () => {
			clear.s1();

			const s1_body = document.querySelector("#tabs-input");
			const header = s1_body.querySelector(".js-tabs__header");
			
						
			const url = host + "/settings/inputs/" + cmd.innerText.toLowerCase();
			fetch(url).then(async res => {
				const inputs = await res.json();
				inputs.forEach(input => {
					header.appendChild(add_header(input));
					s1_body.appendChild(add_body(input));
				});

				//reset tabs
				Tabs({
					elem: "tabs-input",
					open: 0
				});
			});
			
			//파일명을 선택할 수 있도록 헤더를 생성하여 리턴한다.
			function add_header(input) {
				const li = document.createElement("li");
				li.classList.add("js-tabs__title");

				const a = document.createElement("a");
				//a.setAttribute("href", "");
				
				a.appendChild(document.createTextNode(input.filename));
				li.appendChild(a);
				
				return li;
			}
			
			//파일별 입력박스를 생성하여 리턴한다.
			function add_body(input) {
				const dv = document.createElement("div");
				dv.classList.add("js-tabs__content", "input_box");
				dv.dataset.filename = input.filename;
								
				const ta = document.createElement("textarea");
				dv.appendChild(ta);

				//file tag를 통해 입력 데이터를 textarea에 설정한다.
				let file = document.createElement("input");
				file.type="file";
				file.classList.add("file");
				file.addEventListener("change", e => {
					const reader = new FileReader();
					reader.addEventListener("loadend", e => {
						ta.value = e.target.result;
					});
					
					reader.readAsText(e.target.files[0]);
				});

				dv.appendChild(ta);
				dv.appendChild(file);

				return dv;
			}
			
			return true;
		},
		
		s2: dataset => {
			// console.log('init s2');
			clear.s2();
			document.querySelector("#interact").style.display = "block";
			
			const data_type =  dataset["type"];
			if (data_type === "asis") {
				fetch(host + "/settings/restart/" + cmd.innerText.toLowerCase() +"/"+ cmd.dataset.uid).then(async res => {
					S2.view(await res.text());
				});
			} else {
				function start(uid) {
					fetch(host + "/settings/start/" + uid).then(async res => {
						S2.view(await res.text());
					});				
				}

				if (!check_input()) {
					alert("Check your data. there is an empty value.");
					return false;
				}

				DATA.ignite(start);
			}
			
			document.querySelector("#key_in").focus();
			return true;
			
			function check_input() {
				let pass = true;

				const input_tab = document.querySelector("#tabs-input");
				input_tab.querySelectorAll(".input_box > textarea").forEach(e => { 
					if (e.value.length === 0 && pass) {
						pass = false;    
					} 
				});

				return pass;
			}
		},
		
		s3: () => {
			clear.s3();
			
			const uid = cmd.dataset.uid;
			fetch(host + "/settings/report/" + uid).then(async res => {
				const settings = await res.json();
				S3.load_report(settings);
				document.querySelector("#option").style.display = "block";
			}).catch(err => {
				console.log(err);
				document.querySelector("#mesg").innerText = "error while running.";
				document.querySelector("#mesg").style.display = "block";
			});
			
			return true;
		},
	}
		
	const DATA = {
		ignite: async (fn) => {
			
			function read_inputs() {
				const input_tab = document.querySelector("#tabs-input");
				const filenames = input_tab.querySelectorAll(".js-tabs__title");
				const contents = input_tab.querySelectorAll(".input_box > textarea");
				
				let inputs = [];
				contents.forEach((c, idx) => {
					if (c.value.trim().length > 0) {
						const filename = filenames[idx].querySelector("a").textContent.trim();
						const content = c.value;
						
						inputs.push({filename, content});
					}
				});
				
				return inputs;
			}

			const user_datas = read_inputs();
			if (user_datas.length <= 0)
				throw new Error("Your data is not set.");
			
			const res = await fetch(host + "/settings/ignite/" + cmd.innerText.toLowerCase(), {
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify(user_datas)
			});
			const val = await res.json();
				
			cmd.dataset.uid = val.value;
			fn(val.value);
		}
	}
	
	const S2 = {
		view: mesg => {
			document.querySelector('#screen').textContent = mesg;
			if (!mesg) {
				document.querySelector("#screen").classList.remove("error");
			}
		},
		go: key => {
			key_in.value = "";
		
			if (!key)
				key = "LF";
			
			const uid = cmd.dataset.uid;
			fetch(host + "/settings/interact/" + uid +"/"+ encodeURIComponent(key)).then(async res => {
				S2.view(await res.text());
			
				fetch(host + "/settings/status/" + uid).then(async res => {
					const status = await res.text();
					switch(+status) {
						case 0: //doing process
							key_in.focus();
							break;
							
						case 1: //normal done
							document.querySelector("#interact").style.display = "none";
							document.querySelector("[href='#s3']").style.display = "inline";
							break;
							
						case 2: //done with error
							document.querySelector("#interact").style.display = "none";
							document.querySelector("[href='#s3']").style.display = "none";
							document.querySelector("#screen").classList.add("error");
							break;
					}
				});
			});
		}
	}
	
	const S3 = {
		load_report: settings => {
			//console.log('load report: ', settings);

			let table = document.querySelector("#option");
			const into_pipeline = document.querySelector("#into_pipeline");
			const tab_output = document.querySelector("#tabs-output");

			clear.s3();
			
			//set_pipe(settings);
			set_option(settings.kvs);
			set_output(settings.outputs);
		
			
			function set_pipe(settings) {
				into_pipeline.dataset.settings = btoa(JSON.stringify(settings));
			}

			function set_option(kvs) {
				kvs.forEach(kv => add_option(kv));		
			
				function add_option(kv) {
					let r = table.insertRow();

					let c1 = r.insertCell();
					c1.appendChild(document.createTextNode(kv.key));

					let c2 = r.insertCell();
					c2.appendChild(document.createTextNode(kv.value));
					c2.style.color = "green";
					c2.style.fontWeight = "900";
				}
			}
			
			function set_output(outputs) {
				for (const key in outputs) {
					tab_output.querySelector(".js-tabs__header")
						.appendChild(add_header(key));
						
					tab_output.appendChild(add_body(key, outputs[key]));
				}

				//reset tabs
				Tabs({
					elem: "tabs-output",
					open: 0
				});

			
				//파일명을 선택할 수 있도록 헤더를 생성하여 리턴한다.
				function add_header(filename) {
					const li = document.createElement("li");
					li.classList.add("js-tabs__title");

					const a = document.createElement("a");
					a.appendChild(document.createTextNode(filename));
					
					const copy = document.createElement("i");
					copy.title = "copy to clipboard"
					copy.classList.add("fa-solid", "fa-copy");
					copy.addEventListener("click", e => {
						clipboard(document.querySelector("[data-file="+ filename +"]").innerText);
					});
					
					
					li.appendChild(a);
					li.appendChild(copy);
					
					return li;
				}
				
				//파일별 출력결과를 박스에 생성하여 리턴한다.
				function add_body(key, value) {
					const pre = document.createElement("pre");
					//console.log('value: ', value);
					pre.innerText = value.replace(/\\r?\\n/g, "\n");				
					pre.classList.add("js-tabs__content", "cmd_result");
					pre.dataset.file=key;
					
					return pre;
				}
			}
		}	
	}
	
	const navigate = (id, dataset) => {
		let return_val;
		switch(id) {
			case "s1": 
				return_val = init.s1();
				break;
				
			case "s2":
				return_val = init.s2(dataset); 
				break;
				
			case "s3": 
				return_val = init.s3();
				break;
		}

		if (return_val) {
			[].forEach.call(pages, page => {
			   if (page.id === id) {
				   page.classList.add('active');
			   } else {
				   page.classList.remove('active');
			   } 
			});
		}
	}

	const clipboard = val => {
		const ta = document.createElement('textarea');
		ta.textContent = val;
		document.body.appendChild(ta);
		
		ta.select();
		document.execCommand("copy");
		document.body.removeChild(ta);
	}

	const load_sample = async e => {
		e.preventDefault();
		
		const res = await fetch(host + "/settings/sample/" + cmd.innerText.toLowerCase());
		const values = await res.json();
		for (const prop in values) {
			document.querySelectorAll(".input_box").forEach(e => {
				if (e.dataset.filename == prop) {
					e.querySelector("textarea").textContent = values[prop];
				}
			});			
		};
	}
		
	const add_input = filename => {
		function create_li(name, index) {
			
			const li = document.createElement("li");
			li.classList.add("js-tabs__title");
			li.dataset.index = index;
			
			const a = document.createElement("a");
			a.textContent = name;
			
			li.appendChild(a);
			return li;
		}
		
		function create_box(name) {
			const div = document.createElement("div");
			div.classList.add("js-tabs__content", "input_box");
			div.dataset.filename = name;
			
			const ta = document.createElement("textarea");

			const file = document.createElement("input");
			file.classList.add("file");
			file.type = "file";
			file.addEventListener("change", e => {
				const reader = new FileReader();
				reader.addEventListener("loadend", e => {
					ta.value = e.target.result;
				});
				
				reader.readAsText(e.target.files[0]);
			});		

			div.appendChild(ta);
			div.appendChild(file);
			
			return div;
		}
		
		const tab_input = document.querySelector("#tabs-input");
		const filename_length = tab_input.querySelectorAll(".js-tabs__title").length;


		tab_input.appendChild(create_box(filename));
		tab_input.querySelector(".js-tabs__header").appendChild(create_li(filename, filename_length));
		
		//reset tabs
		Tabs({
			elem: "tabs-input",
			open: filename_length
		});
	}

		
	let pages = [];
    document.addEventListener("DOMContentLoaded", () => {
		let links = [];
		
        pages = document.querySelectorAll('[data-page]');
        links = document.querySelectorAll('[data-role="link"]');
		
        pages[0].className = "active";
        [].forEach.call(links, link => {
            link.addEventListener("click", ev => {
				ev.preventDefault();
				const id = ev.currentTarget.href.split("#")[1];
				
				navigate(id, ev.target.dataset);
			});
        });
    		
		
		//S2
		document.querySelector("#go").addEventListener("click", () => S2.go(key_in.value));
		document.querySelector("#key_in").addEventListener("keyup", e => {
			if (e.keyCode === 13) {
				e.preventDefault();
				S2.go(key_in.value);
			}
		});
    });


	return {
		init: () => navigate("s1"),
		clear: clear.all,
		clipboard,
		add_input,
		load_sample
	}
};

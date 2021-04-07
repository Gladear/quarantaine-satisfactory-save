const messageEl = document.querySelector("#message");
const downloadEl = document.querySelector("#download");
const uploadEl = document.querySelector("#upload");
const historyEntriesEl = document.querySelector("#history-entries");

try {
	const app = firebase.app();
	const storage = app.storage();
	const storageRef = storage.ref();
	const db = app.firestore();
	const savesRef = db.collection("saves");

	let pseudo = localStorage.getItem("pseudo");
	if (!pseudo) {
		pseudo = prompt("Please enter your pseudo");
		localStorage.setItem("pseudo", pseudo);
	}

	uploadEl.addEventListener("click", async () => {
		const inputEl = document.createElement("input");
		inputEl.type = "file";
		inputEl.onchange = async () => {
			if (inputEl.files.length === 0) {
				return;
			}
			const file = inputEl.files[0];
			const newDoc = await savesRef.add({
				uploadTime: new Date(),
				uploadedBy: pseudo,
			});
			const fileRef = storageRef.child(newDoc.id + ".sav");
			messageEl.textContent = "Upload in progress...";
			await fileRef.put(file);
			messageEl.textContent = "Upload complete";
		};
		inputEl.click();
	});

	const querySnapshot = await savesRef.orderBy("uploadTime", "desc").get();
	if (querySnapshot.empty) {
		messageEl.textContent = "No save found";
		historyEntriesEl.querySelector("td").textContent = "Not entry found";
		uploadEl.disabled = false;
	} else {
		const lastDoc = querySnapshot.docs[0];
		// Update UI with last save
		const lastSave = lastDoc.data();
		if (lastSave.ownedBy !== undefined && lastSave.ownedBy !== pseudo) {
			document.querySelector("#current-owner").textContent =
				"Currently owned by : " + lastSave.ownedBy;
		} else {
			const url = await storageRef
				.child(lastDoc.id + ".sav")
				.getDownloadURL();
			downloadEl.disabled = false;
			uploadEl.disabled = false;

			downloadEl.addEventListener("click", async () => {
				await lastDoc.ref.update({ ownedBy: pseudo });
				window.open(url, "_blank");
			});
		}

		// Display history
		const formatter = new Intl.DateTimeFormat(undefined, {
			year: "2-digit",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
		historyEntriesEl.innerHTML = "";
		querySnapshot.docs.forEach(async (doc, index) => {
			const data = doc.data();
			const url = await storageRef
				.child(doc.id + ".sav")
				.getDownloadURL();
			historyEntriesEl.insertAdjacentHTML(
				"beforeend",
				`<tr>
                    <td>${data.uploadedBy}</td>
                    <td>${formatter.format(data.uploadTime.seconds * 1000)}</td>
                    <td>${index === 0 ? "y" : "n"}</td>
                    <td class="link"><a href="${url}">${doc.id}</a></td>
                  </tr>`
			);
		});
	}
} catch (e) {
	console.error(e);
	messageEl.textContent =
		"Error loading the Firebase SDK, check the console and report to the administrator.";
}

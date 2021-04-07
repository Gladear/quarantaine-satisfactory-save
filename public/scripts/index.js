const messageEl = document.querySelector("#message");
const downloadEl = document.querySelector("#download");
const uploadEl = document.querySelector("#upload");
const historyEntriesEl = document.querySelector("#history-entries");

try {
	const app = firebase.app();
	const auth = app.auth();
	const storageRef = app.storage().ref();
	const db = app.firestore();
	const savesRef = db.collection("saves");
	const usersRef = db.collection("users");

	async function getUserRef({ uid, displayName }) {
		const querySnapshot = await usersRef
			.where("uid", "==", uid)
			.limit(1)
			.get();
		return querySnapshot.empty
			? await usersRef.add({ uid, displayName })
			: querySnapshot.docs[0].ref;
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
				uploadedBy: await getUserRef(auth.currentUser),
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
		// Update UI with last save
		const lastDoc = querySnapshot.docs[0];
		const lastSave = lastDoc.data();
		const ownedBy = (await lastSave.ownedBy?.get())?.data();
		if (
			ownedBy !== undefined &&
			(auth.currentUser === null || ownedBy.uid !== auth.currentUser.uid)
		) {
			document.querySelector("#current-owner").textContent =
				"Currently owned by : " + ownedBy.displayName;
		} else {
			const url = await storageRef
				.child(lastDoc.id + ".sav")
				.getDownloadURL();
			downloadEl.disabled = false;
			uploadEl.disabled = false;

			downloadEl.addEventListener("click", async () => {
				await lastDoc.ref.update({
					ownedBy: await getUserRef(auth.currentUser),
				});
				window.open(url);
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
			const uploadedBy = (await data.uploadedBy.get()).data();
			historyEntriesEl.insertAdjacentHTML(
				"beforeend",
				`<tr>
                    <td>${uploadedBy.displayName}</td>
                    <td>${formatter.format(data.uploadTime.seconds * 1000)}</td>
                    <td>${index === 0 ? "y" : "n"}</td>
                    <td class="download-link"><a href="${url}">${
					doc.id
				}</a></td>
                  </tr>`
			);
		});
	}
} catch (e) {
	console.error(e);
	messageEl.textContent =
		"Error loading the Firebase SDK, check the console and report to the administrator.";
}

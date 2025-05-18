// ================================
// CRUD + FILTERING FOR CLIENT TASKS
// ================================

/*
  الملاحظات:
  ---------
  - دمجت كل الفلاتر فى دالّة واحدة applyClientTaskFilters()
  - extractMonthYear() تتعامل مع كل صيغ التاريخ وتُرجِع الشهر/السنة بصيغة ثابتة
  - أصلحت أخطاء متغيّرات (finalMissionDateStr، monthSel، employeeFilter، …)
  - أبقيت الدوال غير المستخدمة معلَّقة للتوثيق؛ يمكنك حذفها إن أردت
*/

/* -------------------------------------------------
   1) إضافة مهمة               addInternalTaskRow()
   -------------------------------------------------*/
   function addInternalTaskRow() {
    const form = document.getElementById("clientTaskForm");
    const employeeFilterClient = document.getElementById("employeeFilterClient");
    const companyFilterElement = document.getElementById("companyFilter");
    const collectionName = "clientTasks";
  
    // اجمع بيانات النموذج (باستثناء الموظفين)
    const newRowData = Array.from(form.elements).reduce((data, element) => {
      if (element.tagName === "INPUT" || element.tagName === "SELECT") {
        data[element.id] = element.type === "checkbox" ? element.checked : element.value;
      }
      return data;
    }, {});
  
    const selectedEmployees = Array.from(employeeFilterClient.selectedOptions).map((o) => o.value);
    const companyFilterValue = companyFilterElement ? companyFilterElement.value : "";
  
    newRowData["companyFilterClient"] = companyFilterValue;
  
    if (!selectedEmployees.length) {
      alert("Please select at least one employee");
      return;
    }
  
    selectedEmployees.forEach((employeeId) => {
      db.collection("companies")
        .doc(companyFilterValue)
        .collection("employees")
        .doc(employeeId)
        .get()
        .then((employeeDoc) => {
          if (!employeeDoc.exists) return;
  
          const employeeData = employeeDoc.data();
          const employeeTaskData = { ...newRowData };
          employeeTaskData["employeeFilterClient"] = employeeId;
          employeeTaskData["jobTitleFilterClient"] = employeeData["المسمى الوظيفي"] || "غير متاح";
          employeeTaskData["ترتيب الموظف"] = employeeData["ترتيب الموظف"] || 0;
  
          db.collection(collectionName).add(employeeTaskData).catch((err) => console.error(err));
        })
        .catch((err) => console.error(err));
    });
  
    form.reset();
  }
  
  /* -------------------------------------------------
     2) حذف مهمة               deleteInternalTaskRow()
     -------------------------------------------------*/
  function deleteInternalTaskRow(docId, tableId) {
    if (!docId) return;
    if (!confirm("هل أنت متأكد من أنك تريد حذف هذا السجل؟")) return;
  
    db.collection("clientTasks")
      .doc(docId)
      .delete()
      .then(() => {
        const row = document.querySelector(`tr[data-doc-id='${docId}']`);
        row && row.remove();
      })
      .catch((err) => {
        console.error(err);
        alert("حدث خطأ أثناء حذف المستند.");
      });
  }
  
  /* -------------------------------------------------
     3) بناء صف الجدول        addInternalTaskToTable()
     -------------------------------------------------*/
  function addInternalTaskToTable(tableId, task) {
    const tableBody = document.getElementById(`${tableId}Body`);
    const row = document.createElement("tr");
    row.dataset.docId = task.id;
  
    const orderedKeys = [
      "employeeFilterClient",
      "jobTitleFilterClient",
      "مرحلة_التدريب",
      "تاريخ_المهمة_عميل",
      "اسم_المهمة_عميل",
      "حالة_المهمة_عميل",
      "التفاعل_عميل",
      "ملاحظات_المهام_عميل",
    ];
  
    orderedKeys.forEach((key) => {
      const td = document.createElement("td");
      td.textContent = task[key] || "";
      row.appendChild(td);
    });
  
    // أزرار العمليات
    const actions = document.createElement("td");
  
    const editBtn = document.createElement("button");
    editBtn.textContent = "تعديل";
    editBtn.className = "btn btn1";
    editBtn.onclick = () => editInternalTaskRow(task.id, tableId);
    actions.appendChild(editBtn);
  
    const delBtn = document.createElement("button");
    delBtn.textContent = "حذف";
    delBtn.className = "btn btn2";
    delBtn.onclick = () => deleteInternalTaskRow(task.id, tableId);
    actions.appendChild(delBtn);
  
    row.appendChild(actions);
    tableBody.appendChild(row);
  }
  
  /* -------------------------------------------------
     4) تحرير مهمة            editInternalTaskRow()
     -------------------------------------------------*/
  function editInternalTaskRow(docId, tableId) {
    const form = document.getElementById("clientTaskForm");
  
    db.collection("clientTasks")
      .doc(docId)
      .get()
      .then((doc) => {
        if (!doc.exists) return;
        const data = doc.data();
        Object.keys(data).forEach((k) => {
          const el = form.querySelector(`#${k}`);
          if (!el) return;
          el.type === "checkbox" ? (el.checked = data[k]) : (el.value = data[k]);
        });
  
        const addBtn = form.querySelector("button[onclick^='addInternalTaskRow']");
        addBtn.textContent = "حفظ التغييرات";
        addBtn.onclick = () => saveInternalTaskChanges(docId, tableId);
      });
  }
  
  function saveInternalTaskChanges(docId, tableId) {
    const form = document.getElementById("clientTaskForm");
    const updated = Array.from(form.elements).reduce((acc, el) => {
      if (el.tagName === "INPUT" || el.tagName === "SELECT") {
        acc[el.id] = el.type === "checkbox" ? el.checked : el.value;
      }
      return acc;
    }, {});
  
    db.collection("clientTasks")
      .doc(docId)
      .update(updated)
      .then(() => {
        loadInternalTableData(tableId);
        form.reset();
        const addBtn = form.querySelector("button[onclick]");
        addBtn.textContent = "إضافة مهمة جديدة";
        addBtn.onclick = () => addInternalTaskRow();
      })
      .catch((err) => console.error(err));
  }
  
  /* -------------------------------------------------
     5) فلترة الموظفين عند اختيار الشركة  filterDataClient()
     -------------------------------------------------*/
  function filterDataClient() {
    const companyId = document.getElementById("companyFilter").value;
    const employeeFilter = document.getElementById("employeeFilterClient");
    const jobTitleInput = document.getElementById("jobTitleFilterClient");
  
    employeeFilter.innerHTML = '<option value="">اختر الموظف</option>';
    jobTitleInput.value = "";
    if (!companyId) return;
  
    db.collection("companies")
      .doc(companyId)
      .collection("employees")
      .orderBy("ترتيب الموظف")
      .get()
      .then((snap) => {
        const list = [];
        snap.forEach((d) => {
          const data = d.data();
          const opt = document.createElement("option");
          opt.value = d.id;
          opt.textContent = data["اسم الموظف"] || "اسم غير موجود";
          employeeFilter.appendChild(opt);
          list.push({ id: d.id, jobTitle: data["المسمى الوظيفي"] });
        });
        employeeFilter.addEventListener("change", () => {
          const sel = list.find((e) => e.id === employeeFilter.value);
          jobTitleInput.value = sel ? sel.jobTitle : "";
        });
      });
  }
  
  /* -------------------------------------------------
     6) تحميل كل المهام        loadInternalTableData()
     -------------------------------------------------*/
  function loadInternalTableData(tableId) {
    const tableBody = document.getElementById(`${tableId}Body`);
    if (!tableBody) return;
    tableBody.innerHTML = "";
  
    db.collection("clientTasks")
      .orderBy("ترتيب الموظف")
      .get()
      .then((snap) => {
        snap.forEach((doc) => {
          const task = { id: doc.id, ...doc.data() };
          if (task.employeeFilterClient && task.employeeFilterClient.length === 20) {
            db.collection("companies")
              .doc(task.companyFilterClient)
              .collection("employees")
              .doc(task.employeeFilterClient)
              .get()
              .then((emp) => {
                task.employeeFilterClient = emp.exists ? emp.data()["اسم الموظف"] : "اسم غير موجود";
                addInternalTaskToTable(tableId, task);
              })
              .catch(() => addInternalTaskToTable(tableId, task));
          } else {
            addInternalTaskToTable(tableId, task);
          }
        });
      });
  }
  
  /* -------------------------------------------------
     7) تحميل أسماء الشركات    loadCompanyNames & loadCompanyNamesfilter
     -------------------------------------------------*/
  function loadCompanyNames() {
    const select = document.getElementById("companyFilter");
    select.innerHTML = '<option value="">اختر الشركة</option>';
    db.collection("companies").get().then((snap) => {
      snap.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = d.data()["اسم الشركة"];
        select.appendChild(opt);
      });
    });
  }
  
  function loadCompanyNamesfilter() {
    const select = document.getElementById("companyFilterClient");
    select.innerHTML = '<option value="">اختر الشركة</option>';
    db.collection("companies").get().then((snap) => {
      snap.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = d.data()["اسم الشركة"];
        select.appendChild(opt);
      });
    });
  }
  
  /* -------------------------------------------------
     8) دالّة استخراج الشهر/السنة   extractMonthYear()
     -------------------------------------------------*/
  /* ===== استخراج الشهر والسنة من أي صيغة ===== */
function extractMonthYear(v) {
  let m = "", y = "";

  v = String(v || "").trim();                 // ➊ إزالة الفراغات

  /* محاولة بصيغة YYYY-MM-DD أو DD-MM-YYYY أو D/M/YYYY */
  const reg = /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/;  // 2025-03-16
  const reg2 = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/; // 16-3-2025


  let mArr;
  if ((mArr = v.match(reg))) {
    y = mArr[1];
    m = mArr[2];
  } else if ((mArr = v.match(reg2))) {
    y = mArr[3];
    m = mArr[2];
  } else {
    /* fallback إلى كائن Date */
    const d = new Date(v);
    if (!isNaN(d)) {
      m = String(d.getMonth() + 1);
      y = String(d.getFullYear());
    }
  }

  m = m.padStart(2, "0");                     // ➋ ضمان 01–12
  return { month: m, year: y };
}

let currentFilterRun = 0;

/* -------------------------------------------------
   دالّة الفلترة بعد الإصلاح  applyClientTaskFilters()
   -------------------------------------------------*/
async function applyClientTaskFilters() {
  /* 🔑 رمز مميّز لهذا التشغيل؛ إذا تغيّر يعني أنّ استدعاء أحدث بدأ */
  const token = ++currentFilterRun;

  /* ============= قراءة قيم الفلاتر ============= */
  const companyId = document.getElementById("companyFilterClient").value;
  const rawMonth  = document.getElementById("monthFilterClient").value;
  const monthSel  = rawMonth ? rawMonth.padStart(2, "0") : "";
  const yearSel   = document.getElementById("yearFilterClient").value;

  /* ============= تفريغ الجدول ============= */
  const body = document.getElementById("clientTaskTableBody");
  body.innerHTML = "";

  /* إذا لا توجد فلاتر، حمِّل الجدول كاملًا كالسابق */
  if (!companyId && !monthSel && !yearSel) {
    //loadInternalTableData("clientTaskTable");
    return;
  }

  /* ============= جلب المهام من Firestore ============= */
  const snap = await db.collection("clientTasks").orderBy("ترتيب الموظف").get();

  /* ============= معالجة كل مستند ============= */
  for (const doc of snap.docs) {
    /* إن بدأ تشغيل أحدث أثناء الانتظار ➜ أخرج فورًا */
    if (token !== currentFilterRun) return;

    const task = { id: doc.id, ...doc.data() };

    /* استخراج الشهر والسنة من حقل التاريخ */
    const { month: tm, year: ty } = extractMonthYear(task["تاريخ_المهمة_عميل"]);

    // ✅ تصحيح اللوج: استخدام tm و ty بدل متغيّرات غير موجودة
    // console.log(task["تاريخ_المهمة_عميل"], tm, ty);

    /* تحقُّق المطابقة مع الفلاتر */
    const match =
      (!companyId || task.companyFilterClient === companyId) &&
      (!monthSel  || tm === monthSel) &&
      (!yearSel   || ty === yearSel);

    if (!match) continue;

    /* جلب اسم الموظف (إن وُجد معرّفه) */
    if (task.employeeFilterClient && task.companyFilterClient) {
      try {
        const empDoc = await db
          .collection("companies")
          .doc(task.companyFilterClient)
          .collection("employees")
          .doc(task.employeeFilterClient)
          .get();

        task.employeeFilterClient = empDoc.exists
          ? empDoc.data()["اسم الموظف"]
          : "اسم غير موجود";
      } catch (err) {
        task.employeeFilterClient = "خطأ في تحميل الاسم";
      }
    }

    /* تأكُّد أخير بعد await */
    if (token !== currentFilterRun) return;

    /* إضافة الصف للجدول */
    addInternalTaskToTable("clientTaskTable", task);
  }
}

  /* -------------------------------------------------
   10) تصدير الجدول إلى Excel/CSV  (exportTableToExcel, exportTableToCSVById)
   -------------------------------------------------*/
  function exportTableToExcel(tableID, filename = "export.xlsx") {
    const wb = XLSX.utils.table_to_book(document.getElementById(tableID), { sheet: "Sheet1" });
    XLSX.writeFile(wb, filename);
  }
  
  function exportTableToCSVById(tableId, filename) {
    const rows = [...document.getElementById(tableId).querySelectorAll("tr")];
    let csv = "\uFEFF";
    rows.forEach((r) => {
      const cols = [...r.querySelectorAll("th,td")].map((c) => `"${c.innerText.replace(/"/g, '""')}"`);
      csv += cols.join(",") + "\n";
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  /* -------------------------------------------------
   11) استيراد من إكسل  importExcelFile()
   -------------------------------------------------*/
  async function importExcelFile() {
    const fInput = document.getElementById("excelFile");
    if (!fInput.files[0]) return alert("اختر ملفًا أولاً");
  
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const arr = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (arr.length <= 1) return alert("الملف فارغ");
  
      for (let i = 1; i < arr.length; i++) {
        const row = arr[i];
        if (!row || row.length < 9) continue;
  
        const [companyName, employeeName, jobTitle, trainingStage, missionDateRaw, missionName, taskStatus, interaction, notes = ""] = row;
  
        let finalMissionDateStr = "";
		if (typeof missionDateRaw === "number") {
		  // تحويل التاريخ الرقمي إلى تنسيق النص الأصلي
		  const d = XLSX.SSF.parse_date_code(missionDateRaw);
		  finalMissionDateStr = `${d.y}-${d.m}-${d.d}`; // الحفاظ على تنسيق yyyy-mm-dd
		} else {
		  // إذا كان التاريخ نصيًا، نحتفظ به كما هو
		  finalMissionDateStr = missionDateRaw;
		}

  
        const companyRef = await getOrCreateCompany(companyName);
        const employeeRef = await getOrCreateEmployee(companyRef, employeeName, jobTitle);
  
        await db.collection("clientTasks").add({
          companyFilterClient: companyRef.id,
          employeeFilterClient: employeeRef.id,
          jobTitleFilterClient: jobTitle,
          مرحلة_التدريب: trainingStage,
          تاريخ_المهمة_عميل: finalMissionDateStr,
          اسم_المهمة_عميل: missionName,
          حالة_المهمة_عميل: taskStatus,
          التفاعل_عميل: interaction,
          ملاحظات_المهام_عميل: notes,
        });
      }
      alert("تم الاستيراد بنجاح");
      //loadInternalTableData("clientTaskTable");
    };
    reader.readAsArrayBuffer(fInput.files[0]);
  }
  
  /* -------------------------------------------------
   12) Firebase init + DOMContentLoaded
   -------------------------------------------------*/
  const firebaseConfig = {
    apiKey: "AIzaSyBMzWcjvTStYVHy-BxN2hpMTSQxCBN3nXk",
    authDomain: "excel-sheet-737fa.firebaseapp.com",
    projectId: "excel-sheet-737fa",
    storageBucket: "excel-sheet-737fa.appspot.com",
    messagingSenderId: "202807179886",
    appId: "1:202807179886:web:a3b4c83de711fc4648847f",
    measurementId: "G-YG34XVCJ3X",
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  document.addEventListener("DOMContentLoaded", () => {
    //loadInternalTableData("clientTaskTable");
    loadCompanyNames();
    loadCompanyNamesfilter();
    ["companyFilterClient", "monthFilterClient", "yearFilterClient"].forEach((id) => {
      const el = document.getElementById(id);
      el && el.addEventListener("change", applyClientTaskFilters);
    });
  });
  
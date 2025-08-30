const TokenManager = () => {
    let token = null
    return {
        setToken: (newToken) => {
            token = newToken
        },
        getToken: () => {
            return token
        }
    }
}
let courseId = null
let studentId = null
let login = false
const tokenManager = TokenManager()
const Login = async () => {
    document.querySelector(".loading").style.display = "flex";
    let username = document.getElementById("username").value
    let password = document.getElementById("password").value
    if (tokenManager.getToken() !== null) {
        console.log("Đã có token, không cần đăng nhập lại")
        document.querySelector(".loading").style.display = "none";
    }
    if (tokenManager.getToken() === null) {
        try {
            const response = await fetch("https://sinhvien1.tlu.edu.vn/education/oauth/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    client_id: "education_client",
                    grant_type: "password",
                    username,
                    password,
                    client_secret: "password"
                })
            })
            if (!response.ok) {
                if (response.status === 400) {
                    alert("Tên đăng nhập hoặc mật khẩu không đúng")
                    document.querySelector(".loading").style.display = "none";
                    return

                }
                if (response.status === 500) {
                    alert("Lỗi máy chủ, vui lòng thử lại sau")
                    document.querySelector(".loading").style.display = "none";
                    return
                }
            }
            const data = await response.json()
            tokenManager.setToken(data.access_token)
            login = true
            document.querySelector(".loading").style.display = "none";
        }
        catch (error) {
            console.error("Đăng nhập không thành công:", error)
            await Login()
        }

    }
}
const GetStudentId = async () => {
    document.querySelector(".loading").style.display = "flex";
    if (studentId === null) {
        try {
            const responseForStudentId = await fetch("https://sinhvien1.tlu.edu.vn/education/api/student/getstudentbylogin", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${tokenManager.getToken()}`
                }
            })
            const studentData = await responseForStudentId.json()
            studentId = studentData.id
            document.querySelector(".loading").style.display = "none";
        }
        catch (error) {
            console.error("Lỗi khi lấy studentId:", error)
            await GetStudentId()
        }
    }
}
const GetCourseId = async () => {
    document.querySelector(".loading").style.display = "flex";
    try {
        if (courseId === null) {

            const responseForSemester = await fetch("https://sinhvien1.tlu.edu.vn/education/api/semester/semester_info", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${tokenManager.getToken()}`
                }
            })
            const semesterData = await responseForSemester.json()
            semesterData.semesterRegisterPeriods.forEach(element => {
                const option = document.createElement("option")
                option.value = element.name
                option.textContent = element.name
                document.getElementById("course").appendChild(option)
            });
            courseId = semesterData.semesterRegisterPeriods[0].id
        }
        document.querySelector(".loading").style.display = "none";
    }
    catch (error) {
        console.error("Lỗi khi lấy courseId:", error)
        await GetCourseId()
    }

}
const FindAllCourse = async () => {
    try {
        document.querySelector(".loading").style.display = "flex";
        const findAllCourse = await fetch(`https://sinhvien1.tlu.edu.vn/education/api/cs_reg_mongo/findByPeriod/${studentId}/${courseId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${tokenManager.getToken()}`
            }
        })
        const allCourseData = await findAllCourse.json()
        document.querySelector(".loading").style.display = "none";
        return allCourseData
    }

    catch (error) {
        console.error("Lỗi khi lấy danh sách khóa học:", error)
        await FindAllCourse()
    }
}
document.getElementById("login").addEventListener("click", async () => {
    document.getElementById("container2").innerHTML = ""
    if (courseId === null) {
        document.getElementById("course").innerHTML = ""
    }

    try {
        if (login === false) {
            await Login()
        }
        if (login === true) {
            await GetStudentId()
            await GetCourseId()
            const allCourseData = await FindAllCourse()
            let div = null
            allCourseData.courseRegisterViewObject.listSubjectRegistrationDtos?.forEach(element => {
                div = document.createElement("div")
                div.className = "subjectInfo"
                div.style.backgroundColor = "#f0f0f0"
                p1 = document.createElement("p")
                p1.style.fontWeight = "bold"
                p1.style.fontSize = "50px"
                p1.innerHTML = element.subjectName
                div.appendChild(p1)
                element.courseSubjectDtos?.forEach(course => {
                    endOfSubjectSingle = document.createElement("div")
                    endOfSubjectSingle.className = "endOfSubjectSingle"
                    course.timetables?.forEach(timetable => {
                        const p1 = document.createElement("p")
                        p1.innerHTML = `Tuần: ${timetable.fromWeek} - Tuần:${timetable.toWeek}`
                        const p2 = document.createElement("p")
                        p2.innerHTML = `<b>Thứ: ${timetable.weekIndex} </b> - ${timetable.start} - ${timetable.end} - ${timetable.roomName} `
                        endOfSubjectSingle.appendChild(p1)
                        endOfSubjectSingle.appendChild(p2)
                    })
                    p3 = document.createElement("p")
                    p3.innerHTML = course.displayName
                    endOfSubjectSingle.appendChild(p3)
                    p2 = document.createElement("p")
                    p2.style.fontWeight = "bold"
                    p2.style.fontSize = "20px"
                    p2.innerHTML = `${course.numberStudent}/${course.maxStudent}`
                    endOfSubjectSingle.appendChild(p2)
                    if (course.subCourseSubjects === null) {
                        const nutDangKi = document.createElement("button")
                        nutDangKi.className = "nutDangKi"
                        if (course.isSelected === true) {
                            nutDangKi.innerHTML = "Đã đăng kí học phần này"
                            nutDangKi.style.backgroundColor = "red"
                            nutDangKi.disabled = true
                        }
                        else if (course.overLapClasses.length > 0) {
                            nutDangKi.innerHTML = "Trùng lịch với lớp khác"
                            nutDangKi.style.backgroundColor = "red"
                            nutDangKi.disabled = true
                        }
                        else {
                            nutDangKi.innerHTML = "Đăng ký"
                            nutDangKi.disabled = false
                        }
                        nutDangKi.addEventListener("click", async () => {
                            try {
                                document.querySelector(".loading").style.display = "flex";
                                const responseAddRegister = await fetch(`https://sinhvien1.tlu.edu.vn/education/api/cs_reg_mongo/add-register/${studentId}/${courseId}`, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "Authorization": `Bearer ${tokenManager.getToken()}`
                                    },
                                    body: JSON.stringify({
                                        "id": course.id,
                                        "subjectId": course.subjectId
                                    })
                                })
                                const result = await responseAddRegister.json()
                                document.querySelector(".loading").style.display = "none";
                                if (result.success) {
                                    alert("Đăng ký thành công")
                                } else {
                                    alert(`${result.message}`)
                                }
                            }

                            catch (error) {
                                document.querySelector(".loading").style.display = "none";
                                console.error("Error:", error)
                                alert("Đã xảy ra lỗi. Vui lòng thử lại sau.")
                            }
                        })
                        endOfSubjectSingle.appendChild(nutDangKi)

                    }
                    div.appendChild(endOfSubjectSingle)
                    if (course.subCourseSubjects !== null) {
                        p3 = document.createElement("p")
                        p3.style.fontWeight = "bold"
                        p3.innerHTML = `Các lớp thực hành`
                        div.appendChild(p3)
                        course.subCourseSubjects?.forEach(course => {
                            endOfSubjectSingle = document.createElement("div")
                            endOfSubjectSingle.className = "endOfSubjectSingle"
                            course.timetables?.forEach(timetable => {
                                const p1 = document.createElement("p")
                                p1.innerHTML = `Tuần: ${timetable.fromWeek} - Tuần:${timetable.toWeek}`
                                const p2 = document.createElement("p")
                                p2.innerHTML = `<b>Thứ: ${timetable.weekIndex} </b> - ${timetable.start} - ${timetable.end} - ${timetable.roomName} `
                                endOfSubjectSingle.appendChild(p1)
                                endOfSubjectSingle.appendChild(p2)
                            })
                            p2 = document.createElement("p")
                            p2.style.fontWeight = "bold"
                            p2.style.fontSize = "20px"
                            p2.innerHTML = `${course.numberStudent}/${course.maxStudent}`
                            endOfSubjectSingle.appendChild(p2)
                            const nutDangKi = document.createElement("button")
                            nutDangKi.className = "nutDangKi"
                            if (course.isSelected === true) {
                                nutDangKi.innerHTML = "Đã đăng kí học phần này"
                                nutDangKi.style.backgroundColor = "red"
                                nutDangKi.disabled = true
                            }
                            else if (course.overLapClasses.length > 0) {
                                nutDangKi.innerHTML = "Trùng lịch với lớp khác"
                                nutDangKi.style.backgroundColor = "red"
                                nutDangKi.disabled = true
                            }
                            else {
                                nutDangKi.innerHTML = "Đăng ký"
                                nutDangKi.disabled = false
                            }
                            nutDangKi.addEventListener("click", async () => {
                                try {
                                    document.querySelector(".loading").style.display = "flex";
                                    const responseAddRegister = await fetch(`https://sinhvien1.tlu.edu.vn/education/api/cs_reg_mongo/add-register/${studentId}/${courseId}`, {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            "Authorization": `Bearer ${tokenManager.getToken()}`
                                        },
                                        body: JSON.stringify({
                                            "id": course.id,
                                            "subjectId": course.subjectId
                                        })
                                    })
                                    const result = await responseAddRegister.json()
                                    document.querySelector(".loading").style.display = "none";
                                    if (result.success) {
                                        alert("Đăng ký thành công")
                                    } else {
                                        alert(`${result.message}`)
                                    }
                                }

                                catch (error) {
                                    document.querySelector(".loading").style.display = "none";
                                    console.error("Error:", error)
                                    alert("Đã xảy ra lỗi. Vui lòng thử lại sau.")
                                }
                            })
                            endOfSubjectSingle.appendChild(nutDangKi)

                            div.appendChild(endOfSubjectSingle)


                        })
                    }


                })
                document.getElementById("container2").appendChild(div)
            })
        }






    } catch (error) {
        console.error("Error:", error)
    }

})
let retry = 5
const OnChangePeriod = async () => {
    document.querySelector(".loading").style.display = "flex";
    try {
        const responseForSemester = await fetch("https://sinhvien1.tlu.edu.vn/education/api/semester/semester_info", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${tokenManager.getToken()}`
            }
        })
        const semesterData = await responseForSemester.json()
        semesterData.semesterRegisterPeriods.forEach(element => {
            if (element.name === document.getElementById("course").value) {
                courseId = element.id
            }
        });
        document.querySelector(".loading").style.display = "none";
    }
    catch (error) {
        console.error("Error:", error)
        if (retry > 0) {
            retry--
            OnChangePeriod()
        }
        if (retry === 0) {
            document.querySelector(".loading").style.display = "none";
        }
    }
}
document.getElementById("course").addEventListener("change", async () => {

    await OnChangePeriod()
})



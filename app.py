from flask import Flask, request, render_template_string

app = Flask(__name__)

registered_users = []

html_template = """
<!DOCTYPE html>
<html>
<head>
    <title>User Registration</title>
</head>
<body>
    <h1>회원 등록 시스템</h1>
    <form method="POST">
        <label for="username">아이디 입력:</label>
        <input type="text" id="username" name="username" required>
        <button type="submit">등록</button>
    </form>
    <p>{{ message }}</p>
    <h2>등록된 아이디:</h2>
    <ul>
        {% for user in users %}
            <li>{{ user }}</li>
        {% endfor %}
    </ul>
</body>
</html>
"""

@app.route("/", methods=["GET", "POST"])
def register():
    message = ""
    if request.method == "POST":
        username = request.form["username"]
        if username in registered_users:
            message = "이미 존재하는 아이디입니다."
        else:
            registered_users.append(username)
            message = f"{username} 등록 성공!"
    return render_template_string(html_template, message=message, users=registered_users)

if __name__ == "__main__":
    app.run(debug=True)

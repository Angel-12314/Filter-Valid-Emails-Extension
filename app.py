import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)


CORS(app, resources={r"/*": {"origins": "*"}})


rules = pd.read_excel(
    "email_rules.xlsx",
    sheet_name=0,
    usecols=["Function", "Value"],
    dtype=str
).dropna(how="all")

rules.columns = rules.columns.str.strip()
rules = rules.applymap(lambda x: x.strip() if isinstance(x, str) else x)



def is_valid_email(email):
    email_lower = email.lower()

    contains_values = [
        str(v).strip().lower()
        for f, v in zip(rules["Function"], rules["Value"])
        if str(f).strip().lower() == "contains"
    ]
    starts_values = [
        str(v).strip().lower()
        for f, v in zip(rules["Function"], rules["Value"])
        if str(f).strip().lower() in ["starts with", "start with", "starts wit"]
    ]
    ends_values = [
        str(v).strip().lower()
        for f, v in zip(rules["Function"], rules["Value"])
        if str(f).strip().lower() in ["ends with", "end with"]
    ]

    contains_match = any(val in email_lower for val in contains_values)
    starts_match = any(email_lower.startswith(val) for val in starts_values)
    ends_match = any(email_lower.endswith(val) for val in ends_values)

    print(f"Checking email: {email}")
    print(f"Contains Match: {contains_match}")
    print(f"Starts Match: {starts_match}")
    print(f"Ends Match: {ends_match}")

    
    if contains_match or starts_match or ends_match:
        return True
    else:
        return False


# POST endpoint used by your Chrome extension
@app.route("/validate", methods=["POST"])
def validate_email():
    data = request.json
    email = data.get("email", "")
    valid = is_valid_email(email)
    return jsonify({"email": email, "valid": valid})


# Optional GET endpoint (prevents 405 errors when testing in browser)
@app.route("/validate", methods=["GET"])
def validate_email_get():
    return jsonify({"message": "Use POST method to validate email."}), 200


# Home route (optional, just for Render root page)
@app.route("/")
def home():
    return jsonify({"message": "Email Validator API is running!"}), 200


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)

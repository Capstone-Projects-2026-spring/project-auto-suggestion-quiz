---
sidebar_position: 2
---
# **Integration Tests**

We will be using Pytest for backend and React Testing Library for the frontend. Integration tests will be based on the use cases description for the teacher and student.

## **Teacher User**

### **Use Case 1 - Account creation**

1. This is done using RTL and rendering the full application
2. verify that the account creation form is displayed when the application loads.
3. simulate the user entering a valid email address and university name.
4. simulate clicking the “Create Account” button.
5. confirm that the mocked OTP API was called with the correct parameters.
6. verify that the OTP input field appears after the OTP is successfully “sent”.
7. simulate entering a valid OTP.
8. simulate clicking the verification button.
9. verify that the OTP verification mock was called with the correct data.
10. After successful OTP verification, assert that
   1. A success message is displayed
   2. The user is redirected to the dashboard page (verified by checking that dashboard content is rendered or that the route changes)

### **Use Case 2 - Signing in**

#### **Frontend (RTL)**

1. Verify that when the application loads, the account creation/sign-in page is displayed.
2. Simulate the user clicking the “Login” button.
3. Verify that the sign-in page is displayed.
4. Simulate the user entering a valid email and password into the appropriate input fields.
5. Simulate clicking the “Sign In” button.
6. Verify that the mocked authentication API is called with the correct email and password.
7. If credentials are correct
8. Mock a successful authentication response.
9. Assert that the user is redirected to the dashboard page by verifying that dashboard content is rendered or that the route changes.
10. If not,
11. Mock a successful authentication response.
12. Assert that the user is redirected to the dashboard page by verifying that dashboard content is rendered or that the route changes.

#### **Backend (Pytest)**

##### **Successful Login**

1. Send a POST request to the login endpoint with valid credentials.
2. Verify that:
   1. The response status code indicates success
   2. A valid authentication token or session identifier is returned.
   3. The correct user data is included in the response.

##### **Invalid Credentials**

1. Send a POST request with
2. Incorrect password
3. Non-existent email
4. Verify that
   1. The response status code indicates failure
   2. A error message is returned
   3. No authentication token is issued

##### **Edge Case**

1. Missing email field
2. Missing password field
3. Empty inputs
4. Malformed email format

### **Use Case 3 - Uploading Leetcode Problems**

#### **Frontend (RTL)**

1. Verify that the dashboard page is displayed after login.
2. Simulate the user clicking the “Upload Problem Set” button.
3. Verify that the application redirects to the Upload Problem page.
4. Confirm that input fields for:
   1. Question
   2. Multiple-choice answers
   3. Code boilerplate
   4. are displayed.
5. Simulate the user entering:
   1. A valid problem question
   2. Multiple possible answers
   3. A valid code boilerplate
6. Simulate toggling quiz restriction settings such as:
   1. Show correct answer
   2. Allow multiple attempts
   3. Any other restriction options provided
7. Simulate clicking the “Submit” or “Upload” button.
8. Verify that the mocked backend API responsible for saving the problem set is called with:
   1. The question text
   2. The answer options
   3. The code boilerplate
   4. The selected restriction settings
9. Mock a successful API response and assert that:
   1. A success message is displayed
   2. The user is redirected back to the dashboard
   3. OR
   4. The newly uploaded problem appears in a list of available quizzes

#### **Backend (Pytest)**

1. Successful Problem Upload
2. Send a POST request to the problem upload endpoint containing:
   1. Question text
   2. Multiple-choice answers
   3. Code boilerplate
   4. Restriction settings
   5. Verify that:
   1. The response status code indicates success (e.g., 201 Created).
   2. The problem is correctly stored in the test database.
   3. The restriction settings are saved correctly.
   4. The returned response contains the correct problem data.

##### **Validation**

1. Test invalid submissions
2. Missing question test
3. No answer options provided
4. Missing code boilerplate
5. Invalid restriction configuration
6. Verify that
   1. The response status code indicates failure
   2. An appropriate validation error message is returned
   3. No problem is stored in the database

### **Use Case 4 - Publishing Problems**

1. Frontend Test (RTL)

##### **Scenario 1 : successful publish**

1. Render the application and navigate to a completed quiz editing page.
2. Verify that the “Publish” button is displayed at the bottom of the page.
3. Simulate clicking the “Publish” button.
4. Confirm that the mocked backend publish API is called with the correct quiz identifier.
5. Mock a successful backend response that includes a generated access key.
6. Assert that:
   1. A pop-up or modal appears indicating that the quiz has been successfully published.
   2. The generated access key is displayed in the pop-up.
   3. The success message matches the expected output.

##### **Scenario 2 : Incomplete Quiz**

1. Render the application with a quiz that is missing required fields (e.g., no questions, missing answers, or missing restrictions).
2. Simulate clicking the “Publish” button.
3. Mock a backend validation failure response indicating that the quiz is incomplete.
4. Assert that:
   1. An error notification is displayed.
   2. The pop-up success modal does not appear.
   3. No access key is shown.

#### **Backend (Pytest)**

##### **Scenario 1 : Successful Publish**

1. Create a valid, fully completed quiz in the test database.
2. Send a POST request to the publish endpoint with the quiz ID.
3. Verify that:
   1. The response status code indicates success (e.g., 200 OK).
   2. A unique access key is generated and returned.
   3. The quiz’s status in the database changes to “published”.
   4. The access key is stored in the database and linked to the quiz.

##### **Scenario 2 : Incomplete Quiz**

1. Create an incomplete quiz in the test database.
2. Send a POST request to the publish endpoint.
3. Verify that:
   1. The response status code indicates failure (e.g., 400 Bad Request).
   2. An appropriate validation error message is returned.
   3. No access key is generated.
   4. The quiz remains unpublished in the database.

### **Use Case 5 - Navigating Dashboard**

##### **Scenario 1 : viewing student progress**

1. Render the application in an authenticated state so that the dashboard is displayed.
2. Verify that the dashboard contains buttons for:
   1. Uploading quizzes
   2. Viewing existing quizzes
   3. Viewing student progress and grades
3. Simulate clicking the “View Student Progress and Grades” button.
4. Verify that the application redirects to the student progress page.
5. Confirm that:
   1. A list of students or progress summaries is displayed.
   2. A search input field is visible.
6. Simulate entering a student’s name in the search field.
7. Verify that the list updates to show matching results.
8. Simulate clicking on a specific student’s progress.
9. Assert that a modal or new window opens displaying:
   1. The student’s progress
   2. Their submitted answers

##### **Scenario 2 : Grading and publishing (success)**

1. With the student progress window open, verify that:
   1. A grade input field is displayed.
   2. A notes input field is available.
   3. A “Save and Publish” button is visible.
2. Simulate entering a valid grade.
3. Simulate entering optional notes.
4. Simulate clicking “Save and Publish”.
5. Confirm that the mocked grading API is called with:
   1. The correct student identifier
   2. The entered grade
   3. The notes (if provided)
6. Mock a successful backend response.
7. Assert that:
   1. A success notification appears stating that the grade has been published.
   2. The modal closes or updates to reflect the published status.

##### **Scenario 3 : Incomplete Input Validation**

1. Leave the grade field empty
2. Simulate clicking “Save and Publish”.
3. Assert that:
   1. An error message appears prompting the user to complete required fields.
   2. The mocked API is not called.
   3. No success notification appears.

#### **Backend (Pytest)**

##### **Scenario 1 Retrieving Student Progress**

1. Insert sample student data and quiz submissions into the test database.
2. Send a GET request to the student progress endpoint.
3. Verify that:
   1. The response status code indicates success.
   2. The returned data includes correct student progress information.
   3. Submitted answers are correctly returned.

##### **Scenario 2 Saving and Publishing Grades (Successful Case)**

1. Send a POST or PUT request to the grading endpoint with:
   1. Student ID
   2. Grade value
   3. Notes (if applicable)
   4. Verify that:
   1. The response status code indicates success.
   2. The grade is correctly stored in the database.
   3. The grade status is updated to “published”.
   4. The correct confirmation response is returned.

##### **Scenario 3 Incomplete Input Validation**

1. Attempt to submit a grade without a required field (for example, missing grade value).
2. Verify that:
   1. The response status code indicates failure (for example, 400 Bad Request).
   2. A validation error message is returned.
   3. No grade is stored or published

### **Use Case 6 - deleting a question from a quiz**

#### **Frontend (RTL)**

##### **Scenario 1 – Successful Question Deletion**

1. Render the application in an authenticated state so that the dashboard is displayed.
2. Simulate clicking the “View Existing Quizzes” button.
3. Verify that the application redirects to the existing quizzes page.
4. Confirm that a list of quizzes is displayed.
5. Simulate selecting a specific quiz that contains multiple questions.
6. Verify that the quiz editing page is displayed and that each question has an associated “Delete” button.
7. Simulate clicking the “Delete” button next to a specific question.
8. Verify that a confirmation pop-up appears asking the user to confirm the deletion.
9. Simulate confirming the deletion.
10. Confirm that the mocked delete API is called with the correct quiz ID and question ID.
11. Mock a successful backend response.
12. Assert that:
   1. The question is no longer displayed in the list of quiz questions.
   2. A success notification appears indicating that the question was deleted successfully.

##### **Scenario 2 – Deletion Cancelled**

1. Navigate to the quiz editing page as described above.
2. Simulate clicking the “Delete” button for a question.
3. When the confirmation pop-up appears, simulate cancelling the action.
4. Assert that:
   1. The delete API is not called.
   2. The question remains visible in the quiz.
   3. No success notification appears.

#### **Backend (Pytest)**

##### **Scenario 1. Successful Question Deletion**

1. Insert a quiz with multiple questions into the test database.
2. Send a DELETE request to the question deletion endpoint with the quiz ID and question ID.
3. Verify that:
   1. The response status code indicates success (for example, 200 OK).
   2. The specified question is removed from the database.
   3. The quiz no longer contains the deleted question.

##### **Scenario 2. Attempting to Delete a Non-Existent Question**

1. Send a DELETE request using an invalid or non-existent question ID.
2. Verify that:
   1. The response status code indicates failure (for example, 404 Not Found).
   2. No other questions are affected.

### **Use Case 7 - Changing a Grade for a Student**

#### **Frontend (RTL)**

##### **Scenario 1 – Successful Grade Update**

1. Render the application in an authenticated state so that the dashboard is displayed.
2. Simulate clicking the “View Student Progress and Grades” button.
3. Verify that the application redirects to the student progress and grades page.
4. Confirm that a student search input is displayed.
5. Simulate entering the name or ID of a student whose grade has already been entered.
6. Mock a successful student search response.
7. Verify that the matching student is displayed in the search results.
8. Simulate selecting the student.
9. Verify that the student grade page is displayed.
10. Confirm that the student’s existing grades are shown.
11. Verify that the grade field contains the previously entered grade.
12. Simulate editing the grade input field with a new valid grade.
13. If notes are present or required, simulate updating the notes field.
14. Simulate clicking the “Save and Publish” button.
15. Confirm that the mocked update grade API is called with the correct student ID, grade ID, updated grade value, and notes.
16. Mock a successful backend response.
17. Assert that:
   1. The updated grade is displayed on the student’s grade page.
   2. A success notification appears indicating that the grade was updated successfully.
   3. The mocked notification API or notification handler is called to notify the student.
   4. No validation error message is displayed.

##### **Scenario 2 – Required Fields Incomplete**

1. Navigate to the student grade page as described above.
2. Verify that the student’s existing grade details are displayed.
3. Simulate clearing a required field, such as the grade input field.
4. Simulate clicking the “Save and Publish” button.
5. Assert that:
   1. A validation message appears prompting the user to complete all required fields.
   2. The update grade API is not called.
   3. The student notification API or notification handler is not called.
   4. The previous grade remains displayed or unchanged.
   5. No success notification appears.

#### **Backend (Pytest)**

##### **Scenario 1 – Successful Grade Update**

1. Insert a student into the test database.
2. Insert an existing grade record for that student.
3. Send a PUT or PATCH request to the grade update endpoint with the student ID, grade ID, updated grade value, and notes.
4. Verify that:
   1. The response status code indicates success, for example, 200 OK.
   2. The response contains the updated grade details.
   3. The grade record in the database is updated with the new grade value.
   4. The notes are updated if notes were provided.
   5. The student ID associated with the grade remains unchanged.
   6. A student notification is created, sent, or queued using a mocked notification service.

##### **Scenario 2 – Missing Required Fields**

1. Insert a student and an existing grade record into the test database.
2. Send a PUT or PATCH request to the grade update endpoint with one or more required fields missing, such as an empty grade value.
3. Verify that:
   1. The response status code indicates failure, for example, 400 Bad Request.
   2. The response contains an error message prompting completion of required fields.
   3. The grade record in the database is not updated.
   4. No student notification is created, sent, or queued.

## **Student User Integration Tests**

### **Use Case 1 - Student Creates an Account**

A student registers for a new account to access the platform.

#### **Frontend (RTL)**

##### **Scenario 1 – Successful Account Creation**

1. Render the application at the Sign Up page.
2. Confirm that the sign up form is displayed.
3. Verify that the form contains fields for name, email, and password.
4. Simulate entering valid student information into all required fields.
5. Simulate clicking the “Create Account” button.
6. Confirm that the mocked account creation API is called with the correct name, email, and password.
7. Mock a successful backend response.
8. Assert that:
   1. The student account is created successfully.
   2. A success message appears, if applicable.
   3. The student is redirected to the Login Page.
   4. No validation error messages are displayed.

##### **Scenario 2 – Missing Required Information**

1. Render the application at the Sign Up page.
2. Leave one or more required fields empty, such as email or password.
3. Simulate clicking the “Create Account” button.
4. Assert that:
   1. A validation message is displayed prompting the student to complete all required fields.
   2. The account creation API is not called.
   3. The student remains on the Sign Up page.
   4. No account is created.

##### **Scenario 3 – Account Creation Fails**

1. Render the application at the Sign Up page.
2. Enter valid student information.
3. Simulate clicking the “Create Account” button.
4. Mock a failed backend response, such as an email already being used.
5. Assert that:
   1. An error message is displayed to the student.
   2. The student remains on the Sign Up page.
   3. The student is not redirected to the Login Page.

#### **Backend (Pytest)**

##### **Scenario 1 – Successful Account Creation**

1. Send a POST request to the student registration endpoint with valid name, email, and password.
2. Verify that:
   1. The response status code indicates success, for example, 201 Created.
   2. A new student account is created in the database.
   3. The stored email matches the provided email.
   4. The password is stored securely as a hashed password.
   5. The response does not expose the raw password.

##### **Scenario 2 – Missing Required Fields**

1. Send a POST request to the registration endpoint with one or more required fields missing.
2. Verify that:
   1. The response status code indicates failure, for example, 400 Bad Request.
   2. The response contains a validation error message.
   3. No student account is created in the database.

##### **Scenario 3 – Duplicate Email**

1. Insert an existing student account into the test database.
2. Send a POST request using the same email address.
3. Verify that:
   1. The response status code indicates failure, for example, 409 Conflict.
   2. A duplicate email error message is returned.
   3. No additional student account is created.

### **Use Case 2 - Student Joins a Class Using an Access Code**

A student enrolls in a course using a class access code provided by the instructor.

#### **Frontend (RTL)**

##### **Scenario 1 – Successful Class Join**

1. Render the application in an authenticated student state.
2. Navigate to the Join Class page.
3. Verify that the access code input field is displayed.
4. Simulate entering a valid class access code.
5. Simulate clicking the “Join Class” button.
6. Confirm that the mocked join class API is called with the correct student ID and access code.
7. Mock a successful backend response.
8. Assert that:
   1. The student is added to the class.
   2. A success notification appears.
   3. The student is redirected to the Student Dashboard.
   4. The joined class is available from the dashboard, if displayed there.

##### **Scenario 2 – Invalid Access Code**

1. Render the application in an authenticated student state.
2. Navigate to the Join Class page.
3. Enter an invalid access code.
4. Simulate clicking the “Join Class” button.
5. Mock a failed backend response.
6. Assert that:
   1. An error message is displayed indicating that the access code is invalid.
   2. The student is not redirected to the Student Dashboard.
   3. The student is not added to any class.

##### **Scenario 3 – Empty Access Code**

1. Render the application in an authenticated student state.
2. Navigate to the Join Class page.
3. Leave the access code field empty.
4. Simulate clicking the “Join Class” button.
5. Assert that:
   1. A validation message prompts the student to enter an access code.
   2. The join class API is not called.
   3. The student remains on the Join Class page.

#### **Backend (Pytest)**

##### **Scenario 1 – Successful Class Enrollment**

1. Insert a student into the test database.
2. Insert a class with a valid access code into the test database.
3. Send a POST request to the join class endpoint with the student ID and access code.
4. Verify that:
   1. The response status code indicates success, for example, 200 OK.
   2. The student is added to the class enrollment table or class roster.
   3. The response contains the class information.
   4. No duplicate enrollment is created.

##### **Scenario 2 – Invalid Access Code**

1. Insert a student into the test database.
2. Send a POST request using an invalid access code.
3. Verify that:
   1. The response status code indicates failure, for example, 404 Not Found.
   2. The response contains an error message.
   3. The student is not added to any class.

##### **Scenario 3 – Student Already Enrolled**

1. Insert a student and class into the test database.
2. Enroll the student in the class.
3. Send another POST request using the same access code.
4. Verify that:
   1. The response status code indicates failure or a handled response, for example, 409 Conflict.
   2. No duplicate enrollment is created.
   3. The existing enrollment remains unchanged.

### **Use Case 3 - Student Views Dashboard**

A student views available assignments, completed work, and grades.

#### **Frontend (RTL)**

##### **Scenario 1 – Dashboard Loads Successfully**

1. Render the application in an authenticated student state.
2. Navigate to the Student Dashboard.
3. Mock a successful dashboard data response.
4. Verify that the dashboard page is displayed.
5. Assert that:
   1. Available problems are displayed.
   2. Previously completed problems are displayed.
   3. Grades are displayed where available.
   4. Submission statuses are displayed.
   5. No error message appears.

##### **Scenario 2 – Student Selects a Problem**

1. Render the Student Dashboard with mocked available problems.
2. Confirm that at least one available problem is displayed.
3. Simulate clicking a problem.
4. Assert that:
   1. The selected problem ID is used for navigation.
   2. The student is redirected to the Problem Page.
   3. The problem loading API is called with the correct problem ID.

##### **Scenario 3 – Dashboard Data Fails to Load**

1. Render the application in an authenticated student state.
2. Navigate to the Student Dashboard.
3. Mock a failed dashboard API response.
4. Assert that:
   1. An error message is displayed.
   2. No incorrect problem or grade data is displayed.
   3. A retry option is displayed, if supported.

#### **Backend (Pytest)**

##### **Scenario 1 – Retrieve Dashboard Data Successfully**

1. Insert a student into the test database.
2. Insert available problems for the student’s class.
3. Insert completed submissions and grades for the student.
4. Send a GET request to the student dashboard endpoint.
5. Verify that:
   1. The response status code indicates success, for example, 200 OK.
   2. Available problems are returned.
   3. Completed problems are returned.
   4. Grades are returned.
   5. Submission statuses are returned.

##### **Scenario 2 – Student Has No Assignments**

1. Insert a student into the test database with no assigned problems.
2. Send a GET request to the student dashboard endpoint.
3. Verify that:
   1. The response status code indicates success.
4. Empty lists are returned for available and completed problems.
5. No error occurs.

##### **Scenario 3 – Unauthorized Dashboard Access**

1. Send a GET request to the dashboard endpoint without valid authentication.
2. Verify that:
   1. The response status code indicates failure, for example, 401 Unauthorized.
   2. No dashboard data is returned.

### **Use Case 4 - Student Begins a Coding Problem**

A student opens a coding problem and starts working on it.

#### **Frontend (RTL)**

##### **Scenario 1 – Problem Page Loads Successfully**

1. Render the Student Dashboard with mocked available problems.
2. Simulate selecting a problem.
3. Mock a successful problem details response.
4. Verify that the Problem Page is displayed.
5. Assert that:
   1. The problem description is displayed.
   2. The instructions are displayed.
   3. The code editor is displayed.
   4. Starter code is displayed if available.
   5. No error message appears.

##### **Scenario 2 – Student Types Code**

1. Render the Problem Page with mocked problem data.
2. Confirm that the code editor is displayed.
3. Simulate typing code into the editor.
4. Assert that:
   1. The editor value updates correctly.
   2. The typed code remains visible.
   3. No submission or run API is called yet.

##### **Scenario 3 – Problem Fails to Load**

1. Simulate selecting a problem from the Student Dashboard.
2. Mock a failed problem details response.
3. Assert that:
   1. An error message is displayed.
   2. The problem description is not displayed.
   3. The code editor is not incorrectly populated.
   4. The student remains able to return to the dashboard, if supported.

#### **Backend (Pytest)**

##### **Scenario 1 – Retrieve Problem Details Successfully**

1. Insert a student into the test database.
2. Insert a coding problem assigned to the student.
3. Send a GET request to the problem details endpoint using the problem ID.
4. Verify that:
   1. The response status code indicates success, for example, 200 OK.
   2. The response contains the problem description.
   3. The response contains instructions.
   4. The response contains starter code if applicable.
   5. The returned problem belongs to a class the student is enrolled in.

##### **Scenario 2 – Problem Not Found**

1. Send a GET request using an invalid or non-existent problem ID.
2. Verify that:
   1. The response status code indicates failure, for example, 404 Not Found.
   2. No problem data is returned.

##### **Scenario 3 – Student Not Authorized for Problem**

1. Insert a student into the test database.
2. Insert a problem assigned to a different class.
3. Send a GET request for that problem as the student.
4. Verify that:
   1. The response status code indicates failure, for example, 403 Forbidden.
   2. The problem data is not returned.

### **Use Case 5 - Student Receives and Selects Auto Code Suggestions**

A student is presented with multiple code suggestions and must choose one.

#### **Frontend (RTL)**

##### **Scenario 1 – Correct Suggestion Selected**

1. Render the Problem Page with the code editor displayed.
2. Simulate the student typing code into the editor.
3. Mock the suggestion API returning multiple code suggestions.
4. Verify that multiple suggestions are displayed.
5. Simulate selecting the correct suggestion.
6. Confirm that the mocked suggestion selection API is called with the correct problem ID, student ID, and selected suggestion ID.
7. Mock a successful response identifying the selected suggestion as correct.
8. Assert that:
   1. The correct suggestion is highlighted, or an explanation is displayed.
   2. The selected code suggestion is inserted into the editor.
   3. The student can continue editing the code.
   4. No error message appears.

##### **Scenario 2 – Incorrect Suggestion Selected**

1. Render the Problem Page with the code editor displayed.
2. Simulate the student typing code.
3. Mock the suggestion API returning multiple suggestions.
4. Simulate selecting an incorrect suggestion.
5. Mock a response identifying the selection as incorrect.
6. Assert that:
   1. The selected suggestion is not marked as correct.
   2. Feedback or explanation is displayed, if supported.
   3. The system does not incorrectly insert the wrong code unless the design allows it.
   4. The student remains on the Problem Page.

##### **Scenario 3 – Suggestions Fail to Load**

1. Render the Problem Page with the code editor displayed.
2. Simulate typing code at a point where suggestions should be available.
3. Mock a failed suggestion API response.
4. Assert that:
   1. An error message or fallback message is displayed.
   2. No suggestions are incorrectly displayed.
   3. The student can continue typing code manually.

#### **Backend (Pytest)**

##### **Scenario 1 – Retrieve Code Suggestions Successfully**

1. Insert a student and assigned coding problem into the test database.
2. Send a POST request to the code suggestion endpoint with the current code state.
3. Mock the suggestion generation service.
4. Verify that:
   1. The response status code indicates success, for example, 200 OK.
   2. Multiple code suggestions are returned.
   3. Each suggestion includes an ID and suggested code.
   4. The mocked suggestion service is called with the correct code context.

##### **Scenario 2 – Correct Suggestion Selection**

1. Insert a student, problem, and generated suggestions into the test database.
2. Send a POST request to the suggestion selection endpoint with the selected suggestion ID.
3. Verify that:
   1. The response status code indicates success.
   2. The selected suggestion is marked as correct.
   3. The response contains an explanation or correctness result.
   4. The selection is recorded for the student.

##### **Scenario 3 – Invalid Suggestion Selection**

1. Insert a student and problem into the test database.
2. Send a POST request using an invalid or non-existent suggestion ID.
3. Verify that:
   1. The response status code indicates failure, for example, 404 Not Found.
   2. No suggestion selection is recorded.
   3. No code is inserted or returned as accepted.

### **Use Case 6 - Student Runs Code to View Output**

A student executes their code to check its output.

#### **Frontend (RTL)**

##### **Scenario 1 – Code Runs Successfully**

1. Render the Problem Page with the code editor displayed.
2. Simulate entering valid code into the editor.
3. Simulate clicking the “Run Code” button.
4. Confirm that the mocked run code API is called with the correct problem ID and code content.
5. Mock a successful backend response containing program output.
6. Assert that:
   1. The output is displayed to the student.
   2. No error message is displayed.
   3. The student remains on the Problem Page.
   4. The code remains visible in the editor.

##### **Scenario 2 – Code Produces an Error**

1. Render the Problem Page with the code editor displayed.
2. Simulate entering code with an error.
3. Simulate clicking the “Run Code” button.
4. Mock a backend response containing an error message.
5. Assert that:
   1. The error message is displayed to the student.
   2. The editor still contains the student’s code.
   3. The student remains able to edit and run the code again.
   4. The problem is not marked as submitted.

##### **Scenario 3 – Run Code with Empty Editor**

1. Render the Problem Page with an empty code editor.
2. Simulate clicking the “Run Code” button.
3. Assert that:
   1. A validation message is displayed, if empty code is not allowed.
   2. The run code API is not called.
   3. No output is displayed.

#### **Backend (Pytest)**

##### **Scenario 1 – Run Code Successfully**

1. Insert a student and assigned coding problem into the test database.
2. Send a POST request to the run code endpoint with valid code.
3. Mock the compile and execution service.
4. Verify that:
   1. The response status code indicates success, for example, 200 OK.
   2. The mocked execution service is called with the submitted code.
   3. The response contains the expected output.
   4. The submission is not marked as final.

##### **Scenario 2 – Code Execution Error**

1. Send a POST request to the run code endpoint with code that produces an error.
2. Mock the execution service returning an error.
3. Verify that:
   1. The response status code indicates success with runtime feedback, or failure depending on system design.
   2. The response contains the error message.
   3. The problem status is not changed to submitted.

##### **Scenario 3 – Missing Code Content**

1. Send a POST request to the run code endpoint with missing or empty code.
2. Verify that:
   1. The response status code indicates failure, for example, 400 Bad Request.
   2. The response contains a validation error.
   3. The execution service is not called.

### **Use Case 7 - Student Submits Completed Work**

A student submits their solution for grading.

#### **Frontend (RTL)**

##### **Scenario 1 – Successful Submission**

1. Render the Problem Page with the code editor displayed.
2. Simulate entering completed code into the editor.
3. Simulate clicking the “Submit” button.
4. Confirm that the mocked submit API is called with the correct problem ID, student ID, and final code.
5. Mock a successful backend response.
6. Assert that:
   1. The final code is submitted successfully.
   2. A success notification appears.
   3. The problem status is updated to submitted.
   4. The student is redirected to the Student Dashboard.

##### **Scenario 2 – Submission Validation Fails**

1. Render the Problem Page with the code editor displayed.
2. Leave the code editor empty or provide invalid incomplete code.
3. Simulate clicking the “Submit” button.
4. Assert that:
   1. A validation message is displayed.
   2. The submit API is not called, or a failed response is handled correctly.
   3. The student remains on the Problem Page.
   4. The problem status is not updated to submitted.

##### **Scenario 3 – Submission API Fails**

1. Render the Problem Page with completed code in the editor.
2. Simulate clicking the “Submit” button.
3. Mock a failed backend response.
4. Assert that:
   1. An error message is displayed.
   2. The student remains on the Problem Page.
   3. The problem status is not changed to submitted.
   4. The code remains visible in the editor.

#### **Backend (Pytest)**

##### **Scenario 1 – Successful Work Submission**

1. Insert a student and assigned coding problem into the test database.
2. Send a POST request to the submission endpoint with final code.
3. Verify that:
   1. The response status code indicates success, for example, 201 Created.
   2. The final code is recorded in the database.
   3. The submission time is recorded.
   4. The problem status is updated to submitted.
   5. The submission is associated with the correct student and problem.

##### **Scenario 2 – Missing Final Code**

1. Send a POST request to the submission endpoint with missing or empty code.
2. Verify that:
   1. The response status code indicates failure, for example, 400 Bad Request.
   2. The response contains a validation error.
   3. No final submission is created.
   4. The problem status is not updated to submitted.

##### **Scenario 3 – Submitting a Non-Existent Problem**

1. Insert a student into the test database.
2. Send a POST request using an invalid or non-existent problem ID.
3. Verify that:
   1. The response status code indicates failure, for example, 404 Not Found.
   2. No submission is created.
   3. No problem status is updated.

### **Use Case 8 - Student Saves Progress and Returns Later**

A student pauses work and resumes it at a later time.

#### **Frontend (RTL)**

##### **Scenario 1 – Progress Auto-Saves Successfully**

1. Render the Problem Page with the code editor displayed.
2. Simulate the student typing code into the editor.
3. Simulate exiting the Problem Page without submitting.
4. Confirm that the mocked auto-save API is called with the correct student ID, problem ID, and current code.
5. Mock a successful auto-save response.
6. Assert that:
   1. The current progress is saved.
   2. No submission is created.
   3. The problem remains marked as in progress.
   4. No manual data entry is required after leaving the page.

##### **Scenario 2 – Student Returns to Saved Problem**

1. Render the application in an authenticated student state.
2. Navigate to the Student Dashboard.
3. Mock dashboard data showing an in-progress problem.
4. Simulate selecting the in-progress problem.
5. Mock a successful saved progress response.
6. Assert that:
   1. The Problem Page is displayed.
   2. The saved code state is restored in the editor.
   3. The problem is still marked as in progress.
   4. The student can continue editing.

##### **Scenario 3 – Auto-Save Fails**

1. Render the Problem Page with the code editor displayed.
2. Simulate typing code.
3. Simulate leaving the Problem Page.
4. Mock a failed auto-save response.
5. Assert that:
   1. An error or warning message is displayed, if supported.
   2. No final submission is created.
   3. The student’s local editor state is not cleared before the save failure is handled.

#### **Backend (Pytest)**

##### **Scenario 1 – Save Progress Successfully**

1. Insert a student and assigned coding problem into the test database.
2. Send a POST or PUT request to the save progress endpoint with current code.
3. Verify that:
   1. The response status code indicates success, for example, 200 OK.
   2. The current code is saved in the database.
   3. The problem status is set to in progress.
   4. No final submission record is created.

##### **Scenario 2 – Restore Saved Progress**

1. Insert a student, assigned problem, and saved progress record into the test database.
2. Send a GET request to the saved progress endpoint.
3. Verify that:
   1. The response status code indicates success.
   2. The saved code is returned.
   3. The saved progress is associated with the correct student and problem.
   4. The problem status remains in progress.

##### **Scenario 3 – Save Progress for Invalid Problem**

1. Insert a student into the test database.
2. Send a POST or PUT request using an invalid problem ID.
3. Verify that:
   1. The response status code indicates failure, for example, 404 Not Found.
   2. No progress record is created.
   3. No existing progress records are changed.

### **Use Case 9 - Student Reviews Completed Problems and Grades**

A student reviews feedback and grades for completed assignments.

#### **Frontend (RTL)**

##### **Scenario 1 – Completed Problem Review Loads Successfully**

1. Render the Student Dashboard in an authenticated student state.
2. Mock dashboard data containing completed problems.
3. Verify that completed problems are displayed.
4. Simulate selecting a completed problem.
5. Mock a successful completed problem details response.
6. Assert that:
   1. The final submission is displayed.
   2. The grade is displayed.
   3. Feedback is displayed if available.
   4. Explanations are displayed if available.
   5. No editing controls are shown unless the system allows resubmission.

##### **Scenario 2 – Completed Problem Has No Feedback Yet**

1. Render the Student Dashboard with a completed problem.
2. Simulate selecting the completed problem.
3. Mock a response containing the final submission and grade but no feedback.
4. Assert that:
   1. The final submission is displayed.
   2. The grade is displayed.
   3. A message indicates that feedback is not available yet, if applicable.
   4. No incorrect feedback is displayed.

##### **Scenario 3 – Completed Problem Details Fail to Load**

1. Render the Student Dashboard with completed problems.
2. Simulate selecting a completed problem.
3. Mock a failed completed problem details response.
4. Assert that:
   1. An error message is displayed.
   2. The final submission is not incorrectly displayed.
   3. The student remains able to return to the dashboard.

#### **Backend (Pytest)**

##### **Scenario 1 – Retrieve Completed Problem and Grade Successfully**

1. Insert a student into the test database.
2. Insert a completed problem submission for that student.
3. Insert a grade and feedback for the completed problem.
4. Send a GET request to the completed problem details endpoint.
5. Verify that:
   1. The response status code indicates success, for example, 200 OK.
   2. The final submission is returned.
   3. The grade is returned.
   4. Feedback is returned if available.
   5. The returned data belongs to the correct student.

##### **Scenario 2 – Completed Problem Without Feedback**

1. Insert a student and completed problem submission into the test database.
2. Insert a grade without feedback.
3. Send a GET request to the completed problem details endpoint.
4. Verify that:
   1. The response status code indicates success.
   2. The final submission is returned.
   3. The grade is returned.
   4. The feedback field is empty, null, or contains an appropriate message.



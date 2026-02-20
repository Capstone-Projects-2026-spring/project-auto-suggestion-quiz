# Frontend Class Documentation

# Hierarchy 
- [App](#app)

---

## App
<details>
<summary><b>App - Main component to handle the app's navigation between login, dashboard, and problem pages.</b></summary>


- **Data Fields**
  - **Object currentPage** 
    - Tracks the current page view.
    - Possible values: `login, dashboard, problem`

  - **Object selectedProblem** 
    - Stores the currently selected problem object.
    - Used for display on `ProblemPage`.
    - Value is `null` when no problem is selected.

  - **Object user** 
    - Contains authenticated user data.
    - Fields may include: `email, role`
    - Value is `null` when no user is authenticated.

- **Methods**
  - **handleLogin**(userData)
    - Handles login data and renders depending on userData
    - Calls upon App start
    - Arguements:
      - userData: Object that will change according to user login details
  - **handleProblem**(problem)
    - Sets current page to reflect selected problem type.
    - Arguements:
      - problem: Object pertaining to problem type, and reflects type of problem user will face on page
  - **handleBackToDashboard**()
    - Updates the currentPage to 'dashboard'
    - Unselects problem to 'null'
    - return none





</details>

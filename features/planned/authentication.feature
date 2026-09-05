@planned @authentication
Feature: Learner authentication
  Learners will be able to access the same account with an email one-time
  password, a phone one-time password or Google.

  Scenario: Sign in with an email one-time password
    Given a learner has access to an email address
    When the learner requests and confirms an email one-time password
    Then the learner is authenticated into one account

  Scenario: Sign in with a phone one-time password
    Given a learner has access to a phone number
    When the learner requests and confirms a phone one-time password
    Then the learner is authenticated into one account

  Scenario: Sign in with Google
    Given a learner has a Google account
    When the learner completes Google sign-in
    Then the learner is authenticated into one account

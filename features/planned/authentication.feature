@authentication
Feature: Learner authentication
  Learners will be able to access the same account with passwordless email,
  a phone one-time password or Google.

  @implemented
  Scenario: Sign in to the internal environment with a secure email link
    Given a learner has access to an authorized email address
    When the learner requests and follows a valid email sign-in link
    Then the learner is authenticated into one account

  @planned
  Scenario: Deliver email codes to every learner through dedicated SMTP
    Given a learner has access to any valid email address
    When the learner requests an email one-time password
    Then the dedicated mail provider delivers the code

  @planned
  Scenario: Sign in with a phone one-time password
    Given a learner has access to a phone number
    When the learner requests and confirms a phone one-time password
    Then the learner is authenticated into one account

  @planned
  Scenario: Sign in with Google
    Given a learner has a Google account
    When the learner completes Google sign-in
    Then the learner is authenticated into one account

@profile @saurus
Feature: Learner profile and Saurus
  A first-time learner will create one durable learning profile before the
  product applies the future Saurus allocation rules.

  @implemented
  Scenario: Create a profile after the first authentication
    Given an authenticated learner has no profile
    When the learner submits the required profile information
    Then one learner profile is created

  @implemented
  Scenario: Apply the optional Saurus display suffix
    Given a learner profile named "Mina"
    When the learner keeps the Saurus display suffix enabled
    Then the displayed learner name is "Mina Saurus"

  @planned
  Scenario: Allocate a Saurus from explicit product rules
    Given a learner has completed the required profile information
    When the documented Saurus allocation rules are applied
    Then the allocated Saurus is stored on the learner profile

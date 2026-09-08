@profile @saurus
Feature: Learner profile and Saurus
  A first-time learner creates one durable identity and receives a Saurus
  recommendation before entering the learning experience.

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

  @implemented
  Scenario: Recommend a Saurus before the learner makes the final choice
    Given a learner has completed the required profile information
    And the learner answers the Saurus quiz as "velociraptor-explorer, triceratops-perseverant, brachiosaurus-curious"
    When the documented Saurus allocation rules are applied
    Then "brachiosaurus-curious" is recommended
    And the learner can choose "triceratops-perseverant" instead
    And "triceratops-perseverant" is stored as the stable Saurus species

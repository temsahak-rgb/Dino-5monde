@practice @daily
Feature: Personalized daily session
  Learners receive a short path that turns recent learning signals into action.

  @implemented
  Scenario: Prioritize a low score, a mistake and weak vocabulary
    Given the learner has a low score, a different lesson mistake and weak vocabulary
    When the daily three-step session is prepared
    Then the session contains three unique tasks in learning priority order

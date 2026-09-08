@exercises @review
Feature: Exercise score recommendations
  Learners receive clear retry actions from their latest exercise results.

  @implemented
  Scenario: Recommend a recent score below the mastery target
    Given a learner has a 40 percent Grammar score to improve
    When the personalized exercise review list is prepared
    Then the Grammar exercise is recommended with a direct retry link

  @implemented
  Scenario: Clear a recommendation after a successful retry
    Given a learner improves the same Grammar exercise to 80 percent
    When the personalized exercise review list is prepared
    Then no score recommendation remains for that exercise

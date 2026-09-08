@profile @progress
Feature: Learner progress dashboard
  A learner can understand completed learning paths and game rewards from one
  concise profile overview.

  @implemented
  Scenario: Summarize completed lessons and game rewards
    Given a learner has completed one Grammar lesson and one Travel lesson
    And the learner has earned two different game-level rewards
    When the learner opens the progress dashboard
    Then Grammar, Travel and Games show their completed totals

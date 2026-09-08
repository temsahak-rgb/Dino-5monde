@exercises @progress
Feature: Cross-device exercise history
  A learner can find trustworthy scores from every exercise type in one profile.

  @implemented
  Scenario: Keep one immutable score across repeated synchronization
    Given a learner completes a five-question Grammar exercise with four correct answers
    When the same exercise attempt is synchronized twice
    Then one immutable 80 percent result appears in the learner profile

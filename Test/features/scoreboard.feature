Feature: Scoreboard

  Scenario: Scoreboard shows all players
    Given I access the game page
    When I set player 0 name to Ana
    And I set player 1 name to Bob
    And I remove extra players until only 2 remain
    And I click the Start game button
    Then the scoreboard should show 2 players

  Scenario: Round summary table appears after round ends
    Given I access the game page
    When I set player 0 name to Ana
    And I set player 1 name to Bob
    And I remove extra players until only 2 remain
    And I click the Start game button
    And I force the round to end by staying
    Then I should see the round summary
    And the summary table should have column "Jugador"
    And the summary table should have column "Resultado"
    And the summary table should have column "Puntaje de ronda"
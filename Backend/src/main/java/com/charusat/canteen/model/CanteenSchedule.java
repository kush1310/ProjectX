package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CanteenSchedule {
    private Long id;
    private Long canteenId;
    private String dayOfWeek;
    private LocalTime openTime;
    private LocalTime closeTime;
}

package com.charusat.canteen.repository;

import com.charusat.canteen.model.AddonOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AddonOptionRepository extends JpaRepository<AddonOption, Long> {
}

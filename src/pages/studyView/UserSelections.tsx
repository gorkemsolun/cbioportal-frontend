import * as React from 'react';
import * as _ from 'lodash';
import { observer } from "mobx-react";
import { computed } from 'mobx';
import styles from "./styles.module.scss";
import { StudyViewFilter } from 'shared/api/generated/CBioPortalAPIInternal';
import { ChartMeta, UniqueKey } from 'pages/studyView/StudyViewPageStore';
import { isFiltered } from 'pages/studyView/StudyViewUtils';
import autobind from 'autobind-decorator';

export interface IUserSelectionsProps {
    filter: StudyViewFilter;
    attributesMetaSet: { [id: string]: ChartMeta };
    updateClinicalDataEqualityFilter: (chartMeta: ChartMeta, value: string[]) => void;
    clearGeneFilter: () => void;
    clearCNAGeneFilter: () => void;
    clearCustomCasesFilter: () => void;
    clearAllFilters: () => void
}


@observer
export default class UserSelections extends React.Component<IUserSelectionsProps, {}> {

    constructor(props: IUserSelectionsProps) {
        super(props);
    }

    @computed get showFilters() {
        return isFiltered(this.props.filter)
    }

    @computed private get clinicalDataEqualityFilters() {
        return _.map((this.props.filter.clinicalDataEqualityFilters || []), clinicalDataEqualityFilter => {
            let chartMeta = this.props.attributesMetaSet[clinicalDataEqualityFilter.clinicalDataType + '_' + clinicalDataEqualityFilter.attributeId];
            if (chartMeta) {
                return (
                    <ClinicalDataEqualityFilter
                        chartMeta={chartMeta}
                        values={clinicalDataEqualityFilter.values}
                        updateClinicalDataEqualityFilter={this.props.updateClinicalDataEqualityFilter}
                    />
                )
            } else {
                return null;
            }
        })
    }

    @computed private get mutatedGeneFilter() {
        let chartMeta = this.props.attributesMetaSet[UniqueKey.MUTATED_GENES_TABLE];
        if (chartMeta && !_.isEmpty(this.props.filter.mutatedGenes)) {
            return (
                <span className={styles.filter}>
                    <span className={styles.name}>{chartMeta.displayName}</span>
                    <i className="fa fa-times" style={{ cursor: "pointer" }} onClick={this.props.clearGeneFilter}></i>
                </span>
            )
        }
        return null;
    }

    @computed private get cnaGeneFilter() {
        let chartMeta = this.props.attributesMetaSet[UniqueKey.CNA_GENES_TABLE];
        if (chartMeta && !_.isEmpty(this.props.filter.cnaGenes)) {
            return (
                <span className={styles.filter}>
                    <span className={styles.name}>{chartMeta.displayName}</span>
                    <i className="fa fa-times" style={{ cursor: "pointer" }} onClick={this.props.clearCNAGeneFilter}></i>
                </span>
            )
        }
        return null;
    }

    @computed private get mutationCountVScnaFilter() {
        let chartMeta = this.props.attributesMetaSet[UniqueKey.MUTATION_COUNT_CNA_FRACTION];
        if (chartMeta && !_.isEmpty(this.props.filter.sampleIdentifiers)) {
            return (
                <span className={styles.filter}>
                    <span className={styles.name}>{chartMeta.displayName}</span>
                    <i className="fa fa-times" style={{ cursor: "pointer" }} onClick={this.props.clearCustomCasesFilter}></i>
                </span>
            )
        }
        return null;
    }

    render() {
        if (this.showFilters) {
            return (
                <div className={styles.userSelections}>
                    <span>Your selection:</span>
                    <div>
                        {this.clinicalDataEqualityFilters}
                        {this.cnaGeneFilter}
                        {this.mutatedGeneFilter}
                        {this.mutationCountVScnaFilter}
                        <span><button className="btn btn-default btn-xs" onClick={this.props.clearAllFilters}>Clear All</button></span>
                    </div>
                </div>

            )
        } else {
            return null;
        }
    }
}


export interface IClinicalDataEqualityFilterProps {
    chartMeta: ChartMeta;
    values: string[];
    updateClinicalDataEqualityFilter: (chartMeta: ChartMeta, value: string[]) => void;
}

class ClinicalDataEqualityFilter extends React.Component<IClinicalDataEqualityFilterProps, {}> {

    @autobind
    private updateClinicalDataEqualityFilter(value: String) {
        this.props.updateClinicalDataEqualityFilter(this.props.chartMeta, _.filter(this.props.values, _value => _value !== value))
    }

    render() {
        return (
            <span className={styles.filter}>
                <span className={styles.name}>{this.props.chartMeta.displayName}</span>
                {_.map(this.props.values, value => {
                    return (
                        <UnitFilter
                            value={value}
                            removeClinicalDataEqualityFilter={this.updateClinicalDataEqualityFilter} />
                    )
                })}
            </span>
        )
    }
}

class UnitFilter extends React.Component<{ value: string; removeClinicalDataEqualityFilter: (value: string) => void; }, {}> {

    @autobind
    private removeClinicalDataEqualityFilter() {
        this.props.removeClinicalDataEqualityFilter(this.props.value)
    }

    render() {
        return (
            <span className={styles.value}>
                <span className={styles.label}>{this.props.value}</span>
                <i
                    className="fa fa-times"
                    style={{ cursor: "pointer" }}
                    onClick={this.removeClinicalDataEqualityFilter}
                />
            </span>
        )
    }
}


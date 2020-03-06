import * as React from "react";
import * as Bootstrap from "reactstrap";
import Cristal from "react-cristal";

import { Logger, LogType } from "../lib/Util/Logger";
import NetTest from "../lib/Test/NetTest";
import { PlayerActor } from "../lib/Unit/Actor/PlayerActor";
import { Body } from "../lib/Physics/Body";
import { Vector } from "../lib/Geometry/Vector";
import { Polygon } from "../lib/Geometry/Polygon";
import { Matrix } from "../lib/Geometry/Matrix";
import { World } from "../lib/World";
import { Tools } from "../lib/Util/Tools";
import { ResourceManager } from "../lib/Util/ResourceManager";
import { SimplexNoise } from "../lib/Util/SimplexNoise";
import { Http } from "../lib/Util/Http";
import { Exportable } from "../lib/Exportable";
import { NormalCell } from "../lib/Unit/Cell/NormalCell";

interface ViewProps
{
    close: () => void;
}

interface ViewState
{
    errors: string[];
}

export class TestRunner extends React.PureComponent<ViewProps, ViewState>
{
    public constructor(props: ViewProps)
    {
        super(props);

        this.state = {
            errors: []
        };
    }

    private async init(): Promise<void>
    {
        // For debug
        Tools.Extract(window, {
            World,
            Tools,
            Exportable,
            Vector,
            Matrix,
            NormalCell,
            PlayerActor,
            Logger,
            SimplexNoise,
            ResourceManager,
            Polygon,
            Body,
            Http
        });

        // Run tests
        Logger.Level = LogType.Info;

        try
        {
            await NetTest();
        }
        catch(error)
        {
            const e = error as Error;

            Logger.Warn(this, e.message);

            this.setState({ errors: [e.message, ...this.state.errors] });
        }
        finally
        {
            this.setState({ errors: ["Tests complete", ...this.state.errors] });
        }
    }

    public componentDidMount(): void
    {
        this.init();
    }
    
    private renderInner(): JSX.Element
    {
        return (
            <div>
                {this.state.errors.map(message => 
                    <Bootstrap.Alert 
                        key={message} 
                        color={this.state.errors.length == 1 ? "success" : "danger"}>
                            {message}
                    </Bootstrap.Alert>)}
            </div>
        );
    }
    
    public render(): JSX.Element
    {
        return (
            <Cristal 
                onClose={() => this.props.close()}
                title="Test Runner"
                initialSize={{width: 500, height: 500}}
                isResizable={true}
                initialPosition="top-center">
                    {this.renderInner()}
            </Cristal>
        );
    }
}